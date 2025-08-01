import Fastify from 'fastify';
import FastifyJwt from '@fastify/jwt';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import DB connection and models
import dbConnect from '../lib/db.js';
import Submission from '../lib/models/Submission.js';
import Volunteer from '../lib/models/Volunteer.js';
import AreaSetting from '../lib/models/AreaSetting.js';
import Caleg from '../lib/models/Caleg.js';
import Provinsi from '../lib/models/Provinsi.js';
import KabupatenKota from '../lib/models/KabupatenKota.js';
import Kecamatan from '../lib/models/Kecamatan.js';
import KelurahanDesa from '../lib/models/KelurahanDesa.js';

// --- Fastify setup ---
const app = Fastify({ 
  logger: process.env.NODE_ENV !== 'production' // Log only in development
});

// Connect to DB on startup
app.addHook('onReady', async () => {
  await dbConnect();
});

app.register(FastifyJwt, {
  secret: process.env.JWT_SECRET,
});

// Decorate Fastify instance with authentication guard
app.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Invalid or missing token' });
  }
});

app.decorate('requireAdmin', async function (request, reply) {
  // This relies on 'authenticate' being run first or implicitly called
  try {
    await request.jwtVerify();
    if (request.user.role !== 'admin') {
      reply.status(403).send({ error: 'Admin access required' });
    }
  } catch (err) {
     reply.status(401).send({ error: 'Invalid or missing token' });
  }
});

// Helper: Sign JWT token
function signToken(payload) {
  return app.jwt.sign(payload, { expiresIn: '7d' });
}

// --- Routes ---

// Auth: Login
app.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body || {};

  if (!email || !password) {
    return reply.status(400).send({ error: 'Email and password required' });
  }

  const user = await Volunteer.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return reply.status(401).send({ error: 'Invalid credentials' });
  }

  if (!user.isVerified) {
    return reply.status(403).send({ error: 'Account not yet verified by admin' });
  }

  const token = signToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  return reply.send({
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
});

// Auth: Register
app.post('/api/auth/register', async (request, reply) => {
  const { fullName, email, phoneNumber, password } = request.body || {};

  if (!fullName || !email || !phoneNumber || !password) {
    return reply.status(400).send({ error: 'All fields are required' });
  }

  if (await Volunteer.findOne({ $or: [{ email }, { phoneNumber }] })) {
    return reply.status(409).send({ error: 'Email or phone number already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new Volunteer({ fullName, email, phoneNumber, password: hashedPassword });
  await user.save();

  return reply.status(201).send({
    message: 'Registration successful. Please wait for admin verification.',
  });
});

// --- Admin Routes ---
app.register(async function (adminRoutes) {
  // Apply admin guard to all routes in this plugin
  adminRoutes.addHook('preValidation', app.requireAdmin);

  adminRoutes.post('/api/admin/approve/:id', async (request, reply) => {
    const { id } = request.params;
    await Submission.findByIdAndUpdate(id, { status: 'approved' });
    return reply.send({ success: true });
  });

  adminRoutes.post('/api/admin/flag/:id', async (request, reply) => {
    const { id } = request.params;
    await Submission.findByIdAndUpdate(id, { status: 'flagged' });
    return reply.send({ success: true });
  });

  adminRoutes.post('/api/admin/verify-user/:id', async (request, reply) => {
    const { id } = request.params;
    await Volunteer.findByIdAndUpdate(id, { isVerified: true });
    return reply.send({ success: true });
  });

  adminRoutes.get('/api/admin/unverified-users', async (request, reply) => {
    const users = await Volunteer.find({ isVerified: false });
    return reply.send(users);
  });

  adminRoutes.get('/api/admin/submissions', async (request, reply) => {
    const submissions = await Submission.find({})
      .populate('volunteer', 'fullName email phoneNumber')
      .select('-photo')
      .sort({ createdAt: -1 })
      .lean();

    const normalized = submissions.map((s) => ({
      ...s,
      volunteerDisplayName: s.volunteer?.fullName || s.volunteer?.email || 'Unknown',
      hasPhoto: !!s.photoMime,
    }));
    return reply.send(normalized);
  });

  adminRoutes.get('/api/admin/area-setting', async (request, reply) => {
    const setting = await AreaSetting.findOne({});
    return reply.send(setting);
  });

  adminRoutes.post('/api/admin/area-setting', async (request, reply) => {
    const { provinsi, kabupatenKota } = request.body;
    await AreaSetting.findOneAndUpdate({}, { provinsi, kabupatenKota }, { upsert: true, new: true });
    return reply.send({ success: true });
  });
});

// --- Public & General Routes ---

// Caleg: GET (public) and POST (admin only)
app.get('/api/caleg', async (request, reply) => {
  const caleg = await Caleg.findOne({});
  return reply.send(caleg || {});
});

app.post('/api/caleg', { preHandler: [app.requireAdmin] }, async (request, reply) => {
  const { name } = request.body;
  const caleg = await Caleg.findOneAndUpdate({}, { name }, { upsert: true, new: true });
  return reply.send(caleg);
});

// Wilayah: Provinsi
app.get('/api/provinsi', async (request, reply) => {
  const list = await Provinsi.find({}, { _id: 0, code: 1, name: 1 });
  return reply.send(list);
});

// Wilayah: Kabupaten/Kota by Provinsi
app.get('/api/kabupatenkota', async (request, reply) => {
  const { provinsiCode } = request.query;
  if (!provinsiCode) return reply.status(400).send({ error: 'provinsiCode is required' });
  const list = await KabupatenKota.find({ provinsiCode }, { _id: 0, code: 1, name: 1 });
  return reply.send(list);
});

// Wilayah: Kecamatan by Provinsi & Kabupaten
app.get('/api/kecamatan', async (request, reply) => {
  const { provinsiCode, kabupatenCode } = request.query;
  if (!provinsiCode || !kabupatenCode)
    return reply.status(400).send({ error: 'provinsiCode and kabupatenCode are required' });
  const list = await Kecamatan.find({ provinsiCode, kabupatenCode }, { _id: 0, code: 1, name: 1 });
  return reply.send(list);
});

// Wilayah: Kelurahan/Desa
app.get('/api/kelurahan_desa', async (request, reply) => {
  const { provinsiCode, kabupatenCode, kecamatanCode } = request.query;
  if (!provinsiCode || !kabupatenCode)
    return reply.status(400).send({ error: 'provinsiCode and kabupatenCode are required' });

  const filter = { provinsiCode, kabupatenCode };
  if (kecamatanCode) filter.kecamatanCode = kecamatanCode;

  const list = await KelurahanDesa.find(filter, { _id: 0, code: 1, name: 1 });
  return reply.send(list);
});

// Submissions: Create new
app.post('/api/submissions', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { photoBase64, latitude, longitude, ...otherData } = request.body;

  if (!photoBase64) return reply.status(400).send({ error: 'Photo data is missing.' });

  const [header, base64Data] = photoBase64.split(',');
  const photoMime = header.match(/:(.*?);/)[1];

  const photoBuffer = await sharp(Buffer.from(base64Data, 'base64'))
    .resize({ width: 1024, withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();

  const submissionData = {
    ...otherData,
    volunteer: request.user.id,
    photo: photoBuffer,
    photoMime,
    status: 'pending',
    location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
  };

  try {
    const submission = new Submission(submissionData);
    await submission.save();
    return reply.status(201).send({ success: true, data: submission });
  } catch (error) {
    if (error.code === 11000) {
      return reply.status(409).send({ error: 'Data untuk TPS ini sudah pernah dikirim.' });
    }
    throw error;
  }
});

// Submissions: Get my submissions
app.get('/api/submissions/mine', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { kelurahanDesaCode } = request.query;
  if (!kelurahanDesaCode) return reply.status(400).send({ error: 'kelurahanDesaCode is required' });

  const submissions = await Submission.find({ volunteer: request.user.id, kelurahanDesaCode })
    .select('tps totalVotes calegVotes photo location createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean();

  const mapped = submissions.map((s) => ({
    ...s,
    tpsNumber: s.tps,
    votes: s.totalVotes,
    hasPhoto: !!(s.photo && s.photo.length > 0),
    hasLocation: !!(s.location && s.location.coordinates?.length === 2),
  }));

  return reply.send(mapped);
});

// Submissions: Get photo
app.get('/api/submissions/photo/:id', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const submission = await Submission.findById(id).select('photo photoMime volunteer');

  if (!submission || !submission.photo) return reply.status(404).send('Photo not found');

  if (request.user.role !== 'admin' && submission.volunteer.toString() !== request.user.id) {
    return reply.status(403).send('Forbidden');
  }

  reply.header('Content-Type', submission.photoMime);
  return reply.send(submission.photo);
});

// Submissions: Get detail
app.get('/api/submissions/:id', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const submission = await Submission.findById(id);

  if (!submission) return reply.status(404).send({ error: 'Submission not found' });

  const obj = submission.toObject();
  obj.hasPhoto = !!(obj.photo && obj.photo.length > 0);
  delete obj.photo;
  delete obj.photoMime;

  return reply.send(obj);
});

// Submissions: Update
app.put('/api/submissions/:id', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const { photoBase64, removePhoto, ...updateData } = request.body;

  if (photoBase64) {
    const [header, base64Data] = photoBase64.split(',');
    const photoMime = header.match(/:(.*?);/)[1];
    updateData.photo = await sharp(Buffer.from(base64Data, 'base64'))
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    updateData.photoMime = photoMime;
  } else if (removePhoto) {
    updateData.photo = undefined;
    updateData.photoMime = undefined;
  }

  if (updateData.latitude && updateData.longitude) {
    updateData.location = {
      type: 'Point',
      coordinates: [parseFloat(updateData.longitude), parseFloat(updateData.latitude)],
    };
    delete updateData.latitude;
    delete updateData.longitude;
  }

  const query = request.user.role === 'admin' ? { _id: id } : { _id: id, volunteer: request.user.id };
  const updated = await Submission.findOneAndUpdate(query, { $set: updateData }, { new: true });

  if (!updated) return reply.status(404).send({ error: 'Submission not found or permission denied' });

  return reply.send({ success: true, data: updated });
});

// --- Final handler for Vercel / Node.js server ---
export default async function handler(req, res) {
  await app.ready();
  app.server.emit('request', req, res);
}
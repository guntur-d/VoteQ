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
app.post('/api/login', async (request, reply) => {
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
app.post('/api/register', async (request, reply) => {
  const { fullName, email, phoneNumber, password } = request.body || {};
  if (!fullName || !email || !phoneNumber || !password) {
    return reply.status(400).send({ error: 'All fields are required' });
  }

  // Check if user already exists (optional)
  const exists = await Volunteer.findOne({ $or: [{ phoneNumber }, { email }] });
  if (exists) {
    return reply.status(400).send({ error: 'Phone number or email already registered' });
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new volunteer
  const volunteer = new Volunteer({
    fullName,
    email,
    phoneNumber,
    password: hashedPassword // <-- HASHED!
  });
  await volunteer.save();

  return reply.send({ message: 'Registration successful' });
});

// --- Admin Routes ---
app.register(async function (adminRoutes) {
  // Apply admin guard to all routes in this plugin
  adminRoutes.addHook('preValidation', app.requireAdmin);

  adminRoutes.post('/api/approve', async (request, reply) => {
    const { id } = request.body;
    await Submission.findByIdAndUpdate(id, { status: 'approved' });
    return reply.send({ success: true });
  });

  adminRoutes.post('/api/flag', async (request, reply) => {
    const { id } = request.body;
    await Submission.findByIdAndUpdate(id, { status: 'flagged' });
    return reply.send({ success: true });
  });

  adminRoutes.post('/api/verify_user', async (request, reply) => {
    const { id } = request.body;
    await Volunteer.findByIdAndUpdate(id, { isVerified: true });
    return reply.send({ success: true });
  });

  adminRoutes.post('/api/unverify_volunteer', { preValidation: [app.requireAdmin] }, async (request, reply) => {
    const { id } = request.body || {};
    if (!id) return reply.status(400).send({ error: 'Volunteer ID is required' });

    const updated = await Volunteer.findByIdAndUpdate(id, { isVerified: false }, { new: true });
    if (!updated) return reply.status(404).send({ error: 'Volunteer not found' });

    return reply.send({ success: true, data: updated });
  });

  adminRoutes.get('/api/unverified-users', async (request, reply) => {
    const users = await Volunteer.find({ isVerified: false });
    return reply.send(users);
  });

  adminRoutes.get('/api/submissions', async (request, reply) => {
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

  adminRoutes.get('/api/area-setting', async (request, reply) => {
    const setting = await AreaSetting.findOne({});
    return reply.send(setting);
  });

  adminRoutes.post('/api/area-setting', async (request, reply) => {
    const { provinsi, kabupatenKota } = request.body;
    const adminId = request.user.id;
    await AreaSetting.findOneAndUpdate(
      {},
      { provinsi, kabupatenKota, admin: adminId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return reply.send({ success: true });
  });

  adminRoutes.post('/api/caleg', async (request, reply) => {
    const { name } = request.body;
    const adminId = request.user.id;
    const caleg = await Caleg.findOneAndUpdate({}, { name, admin: adminId }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return reply.send(caleg);
  });
});

// --- Public & General Routes ---

// Caleg: GET (public) and POST (admin only)
app.get('/api/caleg', async (request, reply) => {
  const caleg = await Caleg.findOne({});
  return reply.send(caleg || {});
});

// Wilayah: Provinsi
app.get('/api/provinsi', async (request, reply) => {
  const list = await Provinsi.find({}, { _id: 0, code: 1, name: 1 });
  return reply.send(list);
});

// Wilayah: Kabupaten/Kota by Provinsi
app.post('/api/kabupatenkota', async (request, reply) => {
  const { provinsiCode } = request.body || {};
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
app.get('/api/mine', { preValidation: [app.authenticate] }, async (request, reply) => {
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
app.get('/api/photo/:id', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const submission = await Submission.findById(id).select('photo photoMime volunteer');

  if (!submission || !submission.photo) return reply.status(404).send('Photo not found');

  if (request.user.role !== 'admin' && submission.volunteer.toString() !== request.user.id) {
    return reply.status(403).send('Forbidden');
  }

  reply.header('Content-Type', submission.photoMime);
  return reply.send(submission.photo);
});

// Submissions: Get photo using POST (body params)
app.post('/api/submissions/photo', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { submissionId } = request.body || {};
  
  if (!submissionId) {
    return reply.status(400).send('Missing submission ID');
  }
  
  const submission = await Submission.findById(submissionId).select('photo photoMime volunteer');

  if (!submission || !submission.photo) {
    return reply.status(404).send('Photo not found');
  }

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

// --- Admin: All submissions (POST) ---
app.post('/api/admin_subs', { preValidation: [app.requireAdmin] }, async (request, reply) => {
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

// --- Admin: Unverified users (POST) ---
app.post('/api/admin_unusers', { preValidation: [app.requireAdmin] }, async (request, reply) => {
  try {
    const users = await Volunteer.find({ isVerified: false })
      .select('fullName email phoneNumber isVerified createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Normalize field for frontend compatibility
    const normalized = users.map(u => ({
      ...u,
      verified: u.isVerified // or just use isVerified in frontend
    }));

    return reply.send(normalized);
  } catch (error) {
    console.error('Error fetching unverified users:', error);
    return reply.status(500).send({ error: 'Failed to fetch unverified users' });
  }
});

// Wilayah: Kecamatan (POST)
app.post('/api/kecamatan', async (request, reply) => {
  const { provinsiCode, kabupatenCode } = request.body || {};
  if (!provinsiCode || !kabupatenCode)
    return reply.status(400).send({ error: 'provinsiCode and kabupatenCode are required' });
  const list = await Kecamatan.find({ provinsiCode, kabupatenCode }, { _id: 0, code: 1, name: 1 });
  return reply.send(list);
});

// Wilayah: Kelurahan/Desa (POST)
app.post('/api/kelurahan', async (request, reply) => {
  const { provinsiCode, kabupatenCode, kecamatanCode } = request.body || {};
  if (!provinsiCode || !kabupatenCode)
    return reply.status(400).send({ error: 'provinsiCode and kabupatenCode are required' });

  const filter = { provinsiCode, kabupatenCode };
  if (kecamatanCode) filter.kecamatanCode = kecamatanCode;

  const list = await KelurahanDesa.find(filter, { _id: 0, code: 1, name: 1 });
  return reply.send(list);
});

// User: My submissions (POST)
app.post('/api/mysubs', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { kelurahanDesaCode } = request.body || {};
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

// Submission create
app.post('/api/submission', { preValidation: [app.authenticate] }, async (request, reply) => {
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

// Submission detail (was GET /api/submissions/:id)
app.post('/api/submission_detail', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { id } = request.body || {};
  if (!id) return reply.status(400).send({ error: 'ID is required' });

  const submission = await Submission.findById(id);

  if (!submission) return reply.status(404).send({ error: 'Submission not found' });

  const obj = submission.toObject();
  obj.hasPhoto = !!(obj.photo && obj.photo.length > 0);
  delete obj.photo;
  delete obj.photoMime;

  return reply.send(obj);
});

// Submission update (was PUT /api/submissions/:id)
app.put('/api/submission', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { id, ...updateData } = request.body || {};
  if (!id) return reply.status(400).send({ error: 'ID is required' });

  if (updateData.photoBase64) {
    const [header, base64Data] = updateData.photoBase64.split(',');
    const photoMime = header.match(/:(.*?);/)[1];
    updateData.photo = await sharp(Buffer.from(base64Data, 'base64'))
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    updateData.photoMime = photoMime;
  } else if (updateData.removePhoto) {
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

// Photo fetch (was GET /api/photo/:id and POST /api/submissions/photo)
app.post('/api/photo', { preValidation: [app.authenticate] }, async (request, reply) => {
  const { id } = request.body || {};
  
  if (!id) {
    return reply.status(400).send('Missing submission ID');
  }
  
  const submission = await Submission.findById(id).select('photo photoMime volunteer');

  if (!submission || !submission.photo) {
    return reply.status(404).send('Photo not found');
  }

  if (request.user.role !== 'admin' && submission.volunteer.toString() !== request.user.id) {
    return reply.status(403).send('Forbidden');
  }

  reply.header('Content-Type', submission.photoMime);
  return reply.send(submission.photo);
});

// (Add more routes here: login, protected data, etc.)
export default async function handler(req, res) {
  console.log("🔍 Fastify sees URL:", req.url)
  await app.ready()

  app.server.emit("request", req, res)
}
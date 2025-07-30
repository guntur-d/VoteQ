import Submission from '../models/Submission.js';
import sharp from 'sharp';

const submissionController = {
  async create(req, reply) {
    const { votes, tpsNumber, village, district, photoBase64, photoMime, lat, lng, provinsiCode, kabupatenKotaCode, kecamatanCode, kelurahanDesaCode } = req.body;
    // Decode and compress image
    let buffer = await sharp(Buffer.from(photoBase64, 'base64'))
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    if (buffer.length > 200 * 1024) {
      // Try compressing further if still too large
      buffer = await sharp(Buffer.from(photoBase64, 'base64'))
        .resize({ width: 1024, withoutEnlargement: true })
        .jpeg({ quality: 40 })
        .toBuffer();
      if (buffer.length > 200 * 1024) {
        return reply.code(400).send({ error: 'Image too large, even after compression' });
      }
    }
    const submissionData = {
      volunteerId: req.user.id,
      votes: Number(votes) || 0,
      photo: buffer,
      photoMime,
      tpsNumber,
      village,
      district,
      provinsiCode,
      kabupatenKotaCode,
      kecamatanCode,
      kelurahanDesaCode
    };

    if (lat && lng) {
      submissionData.location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)] // GeoJSON is [longitude, latitude]
      };
    }
    const submission = new Submission(submissionData);
    await submission.save();
    reply.send({ success: true });
  },
  async get(req, reply) {
    const { id } = req.params;
    const submission = await Submission.findById(id).lean();

    if (!submission) {
      return reply.code(404).send({ error: 'Submission not found' });
    }

    // Authorization check: only admin or owner can view
    if (req.user.role !== 'admin' && submission.volunteerId.toString() !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    // Don't send the large photo buffer in the main GET request
    delete submission.photo;
    delete submission.photoMime;

    reply.send(submission);
  },
  async update(req, reply) {
    const { id } = req.params;
    const { votes, tpsNumber, village, district, photoBase64, photoMime, lat, lng, provinsiCode, kabupatenKotaCode, kecamatanCode, kelurahanDesaCode } = req.body;

    const submission = await Submission.findById(id);
    if (!submission) {
      return reply.code(404).send({ error: 'Submission not found' });
    }

    // Authorization check: only admin or owner can edit
    if (req.user.role !== 'admin' && submission.volunteerId.toString() !== req.user.id) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const updateData = { votes: Number(votes) || 0, tpsNumber, village, district, provinsiCode, kabupatenKotaCode, kecamatanCode, kelurahanDesaCode };

    if (lat && lng) {
      updateData.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
    }

    if (photoBase64) {
      // If a new photo is uploaded, process it
      let buffer = await sharp(Buffer.from(photoBase64, 'base64')).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
      if (buffer.length > 200 * 1024) {
        buffer = await sharp(Buffer.from(photoBase64, 'base64')).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 40 }).toBuffer();
        if (buffer.length > 200 * 1024) return reply.code(400).send({ error: 'Image too large, even after compression' });
      }
      updateData.photo = buffer;
      updateData.photoMime = photoMime;
    }

    await Submission.findByIdAndUpdate(id, updateData, { new: true });
    reply.send({ success: true });
  },
  async list(req, reply) {
    const submissions = await Submission.find({});
    reply.send(submissions);
  },
  async listMine(req, reply) {
    const { kelurahanDesaCode } = req.query;
    const filter = { volunteerId: req.user.id };
    if (kelurahanDesaCode) {
      filter.kelurahanDesaCode = kelurahanDesaCode;
    } else {
      // If no code, return empty to avoid sending all user's data
      return reply.send([]);
    }
    const submissions = await Submission.find(filter)
      .sort({ timestamp: -1 })
      .select('tpsNumber votes timestamp photo location') // _id is selected by default
      .lean();

    const results = submissions.map(s => ({
      _id: s._id,
      tpsNumber: s.tpsNumber,
      votes: s.votes,
      timestamp: s.timestamp,
      hasPhoto: !!s.photo,
      hasLocation: !!(s.location && s.location.coordinates && s.location.coordinates.length > 0)
    }));
    reply.send(results);
  },
  async getMineByTps(req, reply) {
    const { kelurahanDesaCode, tpsNumber } = req.query;
    if (!kelurahanDesaCode || !tpsNumber) {
      return reply.code(400).send({ error: 'kelurahanDesaCode and tpsNumber are required' });
    }

    const submission = await Submission.findOne({
      volunteerId: req.user.id,
      kelurahanDesaCode,
      tpsNumber
    }).lean();

    if (!submission) {
      return reply.code(404).send({ error: 'Submission not found for this TPS' });
    }

    // Don't send the large photo buffer in the main GET request
    delete submission.photo;
    delete submission.photoMime;

    reply.send(submission);
  },
  async getPhoto(req, reply) {
    const submission = await Submission.findById(req.params.id);
    if (!submission || !submission.photo) return reply.code(404).send();
    reply.header('Content-Type', submission.photoMime).send(submission.photo);
  }
};
export default submissionController;

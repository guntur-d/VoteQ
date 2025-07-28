import Submission from '../models/Submission.js';
import sharp from 'sharp';

const submissionController = {
  async create(req, reply) {
    const { outcome, votes, gps, tpsNumber, village, district, photoBase64, photoMime } = req.body;
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
    const submission = new Submission({
      volunteerId: req.user.id,
      outcome,
      votes,
      photo: buffer,
      photoMime,
      gps,
      tpsNumber,
      village,
      district
    });
    await submission.save();
    reply.send({ success: true });
  },
  async list(req, reply) {
    const submissions = await Submission.find({});
    reply.send(submissions);
  },
  async getPhoto(req, reply) {
    const submission = await Submission.findById(req.params.id);
    if (!submission || !submission.photo) return reply.code(404).send();
    reply.header('Content-Type', submission.photoMime).send(submission.photo);
  }
};
export default submissionController;

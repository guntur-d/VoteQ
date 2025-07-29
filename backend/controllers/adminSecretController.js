import AdminSecret from '../models/AdminSecret.js';
import bcrypt from 'bcryptjs';

export default {
  async setSecret(req, reply) {
    const { secret } = req.body;
    if (!secret) return reply.code(400).send({ error: 'Secret required' });
    const hash = await bcrypt.hash(secret, 10);
    await AdminSecret.deleteMany({}); // Only one secret at a time
    await AdminSecret.create({ hash });
    reply.send({ success: true });
  },
  async verifySecret(req, reply) {
    const { secret } = req.body;
    if (!secret) return reply.code(400).send({ error: 'Secret required' });
    const doc = await AdminSecret.findOne();
    if (!doc) return reply.code(404).send({ error: 'No secret set' });
    const valid = await bcrypt.compare(secret, doc.hash);
    if (!valid) return reply.code(401).send({ error: 'Invalid secret' });
    // Issue a simple session token (could be JWT or random string)
    // For simplicity, just return success
    reply.send({ success: true });
  }
};

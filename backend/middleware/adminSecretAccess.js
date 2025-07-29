import AdminSecret from '../models/AdminSecret.js';
import bcrypt from 'bcryptjs';

export default async function (req, reply) {
  // Check for x-admin-secret header
  const secret = req.headers['x-admin-secret'];
  if (!secret) return reply.code(401).send({ error: 'Admin secret required' });
  const doc = await AdminSecret.findOne();
  if (!doc) return reply.code(403).send({ error: 'No admin secret set' });
  const valid = await bcrypt.compare(secret, doc.hash);
  if (!valid) return reply.code(403).send({ error: 'Invalid admin secret' });
  // Allow access
}

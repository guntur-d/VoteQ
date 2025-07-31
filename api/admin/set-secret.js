// api/admin/set-secret.js - Serverless endpoint to set admin secret
import dbConnect from '../../lib/db.js';
import AdminSecret from '../../lib/models/AdminSecret.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { secret } = req.body;
  if (!secret) return res.status(400).json({ error: 'Secret required' });
  const hash = await bcrypt.hash(secret, 10);
  await AdminSecret.deleteMany({}); // Only one secret at a time
  await AdminSecret.create({ hash });
  res.status(200).json({ success: true });
}

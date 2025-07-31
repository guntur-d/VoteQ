// api/admin/verify-secret.js - Serverless endpoint to verify admin secret
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
  const doc = await AdminSecret.findOne();
  if (!doc) return res.status(404).json({ error: 'No secret set' });
  const valid = await bcrypt.compare(secret, doc.hash);
  if (!valid) return res.status(401).json({ error: 'Invalid secret' });
  // For simplicity, just return success
  res.status(200).json({ success: true });
}

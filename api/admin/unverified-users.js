// /api/admin/unverified-users.js - Get unverified users API
import dbConnect from '../../lib/db.js';
import Volunteer from '../../lib/models/Volunteer.js';
import { requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'GET') {
    const user = requireAdmin(req, res);
    if (!user) return;
    
    try {
      const users = await Volunteer.find(
        { isVerified: false },
        { password: 0 }
      ).sort({ createdAt: -1 });
      
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch unverified users' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

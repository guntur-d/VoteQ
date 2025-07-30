// /api/admin/verify-user/[id].js - Verify user API
import dbConnect from '../../../lib/db.js';
import Volunteer from '../../../lib/models/Volunteer.js';
import { requireAdmin } from '../../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'POST') {
    const user = requireAdmin(req, res);
    if (!user) return;
    
    try {
      const { id } = req.query;
      
      const volunteer = await Volunteer.findByIdAndUpdate(
        id,
        { isVerified: true },
        { new: true }
      );
      
      if (!volunteer) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(200).json({ message: 'User verified successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to verify user' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

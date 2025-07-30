// /api/admin/submissions.js - Get all submissions for admin
import dbConnect from '../../lib/db.js';
import Submission from '../../lib/models/Submission.js';
import { requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'GET') {
    const user = requireAdmin(req, res);
    if (!user) return;
    
    try {
      const submissions = await Submission.find({})
        .populate('volunteer', 'fullName phoneNumber')
        .sort({ createdAt: -1 });
      
      res.status(200).json(submissions);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

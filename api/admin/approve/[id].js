// /api/admin/approve/[id].js - Approve submission
import dbConnect from '../../../lib/db.js';
import Submission from '../../../lib/models/Submission.js';
import { requireAdmin } from '../../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'POST') {
    const user = requireAdmin(req, res);
    if (!user) return;
    
    try {
      const { id } = req.query;
      
      const submission = await Submission.findByIdAndUpdate(
        id,
        { status: 'approved' },
        { new: true }
      );
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      res.status(200).json({ message: 'Submission approved successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to approve submission' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

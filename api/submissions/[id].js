// /api/submissions/[id].js - Get/update specific submission
import dbConnect from '../../lib/db.js';
import Submission from '../../lib/models/Submission.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  const user = requireAuth(req, res);
  if (!user) return;
  
  const { id } = req.query;
  
  if (req.method === 'GET') {
    try {
      let submission;
      if (user.role === 'admin') {
        submission = await Submission.findById(id).populate('volunteer', 'fullName phoneNumber');
      } else {
        submission = await Submission.findOne({ _id: id, volunteer: user.id });
      }
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      res.status(200).json(submission);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { tps, village, district, totalVotes, calegVotes, latitude, longitude } = req.body;
      
      // Users can only update their own submissions
      const query = user.role === 'admin' ? { _id: id } : { _id: id, volunteer: user.id };
      
      const submission = await Submission.findOneAndUpdate(
        query,
        { tps, village, district, totalVotes, calegVotes, latitude, longitude },
        { new: true }
      );
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      res.status(200).json({ message: 'Submission updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update submission' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

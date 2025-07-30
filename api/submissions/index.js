// /api/submissions/index.js - Submissions API
import dbConnect from '../../lib/db.js';
import Submission from '../../lib/models/Submission.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    
    try {
      const { tps, village, district, totalVotes, calegVotes, latitude, longitude } = req.body;
      
      if (!tps || !village || !district || totalVotes === undefined || calegVotes === undefined) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }
      
      const submission = new Submission({
        volunteer: user.id,
        tps,
        village,
        district,
        totalVotes,
        calegVotes,
        latitude,
        longitude,
        status: 'pending'
      });
      
      await submission.save();
      res.status(201).json({ message: 'Submission created successfully', id: submission._id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create submission' });
    }
  } else if (req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    
    try {
      let submissions;
      if (user.role === 'admin') {
        // Admin can see all submissions
        submissions = await Submission.find({}).populate('volunteer', 'fullName phoneNumber').sort({ createdAt: -1 });
      } else {
        // Regular users see only their submissions
        submissions = await Submission.find({ volunteer: user.id }).sort({ createdAt: -1 });
      }
      
      res.status(200).json(submissions);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

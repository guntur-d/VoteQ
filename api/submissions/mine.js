// /api/submissions/mine.js - Get user's own submissions
import dbConnect from '../../lib/db.js';
import Submission from '../../lib/models/Submission.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    try {
      const { district, village, volunteerId } = req.query;
      const filter = { volunteer: user.id };
      if (district) filter.district = district;
      if (village) filter.village = village;
      if (volunteerId) filter.volunteer = volunteerId;
      console.log('[submissions/mine] filter:', filter);
      const submissions = await Submission.find(filter).sort({ createdAt: -1 });
      // Add hasPhoto and hasLocation fields for frontend compatibility
      const mapped = submissions.map(s => ({
        _id: s._id,
        tpsNumber: s.tpsNumber,
        votes: s.votes,
        calegVotes: s.calegVotes,
        district: s.district,
        village: s.village,
        volunteer: s.volunteer,
        hasPhoto: !!(s.photo && s.photo.length > 0),
        hasLocation: !!(s.location && Array.isArray(s.location.coordinates) && s.location.coordinates.length === 2),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }));
      console.log('[submissions/mine] mapped submissions:', mapped);
      res.status(200).json(mapped);
    } catch (err) {
      console.error('[submissions/mine] error:', err);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

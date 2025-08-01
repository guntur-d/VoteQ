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
      const { district, village, volunteerId, kelurahanDesaCode, kecamatanCode } = req.query;
      const filter = { volunteer: user.id };
      
      // Try multiple filtering approaches
      if (district) filter.district = district;
      if (village) filter.village = village;
      if (kelurahanDesaCode) filter.kelurahanDesaCode = kelurahanDesaCode;
      if (kecamatanCode) filter.kecamatanCode = kecamatanCode;
      if (volunteerId) filter.volunteer = volunteerId;
      
      console.log('[submissions/mine] query params:', req.query);
      console.log('[submissions/mine] filter:', filter);
      console.log('[submissions/mine] user.id:', user.id);
      
      const submissions = await Submission.find(filter).sort({ createdAt: -1 });
      console.log('[submissions/mine] found submissions count:', submissions.length);
      
      // Also try to find ANY submissions for this user to see what's in the database
      const allUserSubmissions = await Submission.find({ volunteer: user.id }).sort({ createdAt: -1 });
      console.log('[submissions/mine] ALL user submissions:', allUserSubmissions.map(s => ({
        _id: s._id,
        district: s.district,
        village: s.village,
        kelurahanDesaCode: s.kelurahanDesaCode,
        kecamatanCode: s.kecamatanCode,
        tpsNumber: s.tpsNumber,
        tps: s.tps
      })));
      // Add hasPhoto and hasLocation fields for frontend compatibility
      const mapped = submissions.map(s => ({
        _id: s._id,
        tpsNumber: s.tpsNumber || s.tps, // Handle both legacy and new field names
        votes: s.votes || s.calegVotes || s.totalVotes, // Handle multiple vote field names
        calegVotes: s.calegVotes,
        totalVotes: s.totalVotes,
        district: s.district,
        village: s.village,
        volunteer: s.volunteer,
        hasPhoto: !!(s.photo && s.photo.length > 0),
        hasLocation: !!(s.location && Array.isArray(s.location.coordinates) && s.location.coordinates.length === 2) || !!(s.latitude && s.longitude),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }));
      console.log('[submissions/mine] mapped submissions:', mapped);
      console.log('[submissions/mine] original submissions from DB:', submissions.map(s => ({
        _id: s._id,
        tpsNumber: s.tpsNumber,
        tps: s.tps,
        votes: s.votes,
        calegVotes: s.calegVotes,
        totalVotes: s.totalVotes,
        district: s.district,
        village: s.village,
        volunteer: s.volunteer,
        photo: s.photo ? 'has photo' : 'no photo',
        location: s.location,
        latitude: s.latitude,
        longitude: s.longitude
      })));
      res.status(200).json(mapped);
    } catch (err) {
      console.error('[submissions/mine] error:', err);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

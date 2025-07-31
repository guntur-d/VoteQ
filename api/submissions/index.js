// /api/submissions/index.js - Submissions API
import dbConnect from '../../lib/db.js';
import Submission from '../../lib/models/Submission.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;

    // Parse JSON body if not already parsed
    if (!req.body) {
      let data = '';
      await new Promise((resolve, reject) => {
        req.on('data', chunk => data += chunk);
        req.on('end', resolve);
        req.on('error', reject);
      });
      if (!data) {
        console.error('[SUBMISSION][POST] No body data received');
        return res.status(400).json({ error: 'No body data received' });
      }
      try {
        req.body = JSON.parse(data);
      } catch (e) {
        console.error('[SUBMISSION][POST] Failed to parse JSON body:', e, 'Raw:', data);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    try {
      console.log('[SUBMISSION][POST] req.body:', req.body);
      const { votes, tpsNumber, village, district, photoBase64, photoMime, lat, lng, provinsiCode, kabupatenKotaCode, kecamatanCode, kelurahanDesaCode } = req.body;

      if (!tpsNumber || !village || !district || votes === undefined) {
        console.error('[SUBMISSION][POST] Missing required fields:', req.body);
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      let buffer = null;
      if (photoBase64) {
        const sharp = (await import('sharp')).default;
        buffer = await sharp(Buffer.from(photoBase64, 'base64'))
          .resize({ width: 1024, withoutEnlargement: true })
          .jpeg({ quality: 70 })
          .toBuffer();
        if (buffer.length > 200 * 1024) {
          buffer = await sharp(Buffer.from(photoBase64, 'base64'))
            .resize({ width: 1024, withoutEnlargement: true })
            .jpeg({ quality: 40 })
            .toBuffer();
          if (buffer.length > 200 * 1024) {
            return res.status(400).json({ error: 'Image too large, even after compression' });
          }
        }
      }

      // Check for unique tpsNumber in this kelurahanDesaCode
      if (tpsNumber && kelurahanDesaCode) {
        const exists = await Submission.findOne({ tpsNumber, kelurahanDesaCode });
        if (exists) {
          return res.status(400).json({ error: 'TPS number already exists for this desa. Please use a unique TPS.' });
        }
      }

      const submissionData = {
        volunteerId: user.id,
        votes: Number(votes) || 0,
        photo: buffer,
        photoMime,
        tpsNumber,
        village,
        district,
        provinsiCode,
        kabupatenKotaCode,
        kecamatanCode,
        kelurahanDesaCode
      };

      if (lat && lng) {
        submissionData.location = {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        };
      }

      const submission = new Submission(submissionData);
      await submission.save();
      res.status(201).json({ message: 'Submission created successfully', id: submission._id });
    } catch (err) {
      console.error('[SUBMISSION][POST] Error saving submission:', err);
      res.status(500).json({ error: 'Failed to create submission', details: err.message });
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

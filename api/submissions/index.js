// api/submissions/index.js
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import dbConnect from '../../lib/db.js';
import Submission from '../../lib/models/Submission.js';
import Volunteer from '../../lib/models/Volunteer.js';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      // 1. Authenticate the user from the token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
      }
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await Volunteer.findById(decoded.id).lean();
      if (!user) {
        return res.status(403).json({ error: 'Forbidden: User not found' });
      }

      const {
        photoBase64,
        photoContentType,
        latitude,
        longitude,
        ...otherData
      } = req.body;

      // 2. Validate essential data from the body
      if (!photoBase64 || !photoContentType) {
        return res.status(400).json({ error: 'Photo data is missing.' });
      }

      // 3. Compress the photo using sharp
      let photoBuffer = await sharp(Buffer.from(photoBase64, 'base64'))
        .resize({ width: 1024, withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();

      // Optional: further compression if needed
      if (photoBuffer.length > 200 * 1024) { // 200KB limit
        photoBuffer = await sharp(Buffer.from(photoBase64, 'base64'))
          .resize({ width: 1024, withoutEnlargement: true })
          .jpeg({ quality: 40 })
          .toBuffer();
        if (photoBuffer.length > 200 * 1024) {
          return res.status(400).json({ error: 'Image too large, even after compression' });
        }
      }

      // 4. Prepare the complete submission document
      const submissionData = {
        ...otherData,
        volunteer: user._id,
        photo: photoBuffer,
        photoMime: photoContentType,
        status: 'pending', // Default status
      };

      // 5. Add location data if provided
      if (latitude && longitude) {
        submissionData.location = {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)], // [longitude, latitude]
        };
      } else {
        // If location is strictly required by your schema, you might want to error out.
        // For now, we'll just not include it if missing.
        // But your schema has it as required, so this will fail validation if not present.
        return res.status(400).json({ error: 'GPS location is required.' });
      }

      // 6. Create and save the new submission
      const submission = new Submission(submissionData);
      await submission.save();

      res.status(201).json({ success: true, data: submission });

    } catch (error) {
      console.error('[SUBMISSION][POST] Error saving submission:', error);
      // Mongoose validation error
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      // MongoDB unique index violation (duplicate key)
      if (error.code === 11000) {
        return res.status(409).json({ error: 'TPS sudah ada, silakan gunakan form edit untuk mengubah data' });
      }
      res.status(500).json({ error: 'Server error while creating submission.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
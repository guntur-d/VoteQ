// /api/submissions/[id].js - Get/update specific submission
import dbConnect from '../../lib/db.js';
import Submission from '../../lib/models/Submission.js';
import Volunteer from '../../lib/models/Volunteer.js'; // Import to register schema
import { requireAuth } from '../../lib/auth.js';
import sharp from 'sharp';

export default async function handler(req, res) {
  await dbConnect();
  
  const user = requireAuth(req, res);
  if (!user) return;
  
  const { id } = req.query;
  
  if (req.method === 'GET') {
    try {
      console.log('[SUBMISSION][GET] User ID:', user.id);
      console.log('[SUBMISSION][GET] User Role:', user.role);
      console.log('[SUBMISSION][GET] Submission ID:', id);
      
      let submission;
      if (user.role === 'admin') {
        // For admin, find submission without populate to avoid schema issues
        submission = await Submission.findById(id);
      } else {
        // Try both volunteer and volunteerId fields for compatibility
        submission = await Submission.findOne({ 
          _id: id, 
          $or: [
            { volunteer: user.id },
            { volunteerId: user.id }
          ]
        });
      }
      
      console.log('[SUBMISSION][GET] Found submission:', submission ? 'Yes' : 'No');
      if (submission) {
        console.log('[SUBMISSION][GET] Submission volunteer:', submission.volunteer);
        console.log('[SUBMISSION][GET] Submission volunteerId:', submission.volunteerId);
        console.log('[SUBMISSION][GET] Submission data keys:', Object.keys(submission.toObject()));
      } else {
        // Let's see what submissions exist for this user
        const allUserSubmissions = await Submission.find({ 
          $or: [
            { volunteer: user.id },
            { volunteerId: user.id }
          ]
        }).select('_id volunteer volunteerId tps tpsNumber');
        console.log('[SUBMISSION][GET] All user submissions:', allUserSubmissions);
        
        // Also try to find this specific submission regardless of user
        const anySubmission = await Submission.findById(id).select('_id volunteer volunteerId tps tpsNumber');
        console.log('[SUBMISSION][GET] Submission exists (any user):', anySubmission);
      }
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      // Convert to a plain object to manipulate it
      const submissionObject = submission.toObject();
      
      // Add a hasPhoto flag and remove the large buffer from the response for efficiency
      submissionObject.hasPhoto = !!(submissionObject.photo && submissionObject.photo.length > 0);
      delete submissionObject.photo;
      delete submissionObject.photoMime;
      
      res.status(200).json(submissionObject);
    } catch (err) {
      console.error('[SUBMISSION][GET] Error:', err);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  } else if (req.method === 'PUT') {
    try {
      // Destructure all updatable fields from the request body
      const {
        tps,
        totalVotes,
        calegVotes,
        latitude,
        longitude,
        photoBase64, // For optional photo update
        photoContentType
      } = req.body;

      // Build the update object dynamically
      const updateData = { tps, totalVotes, calegVotes };

      // Handle location update
      if (latitude && longitude) {
        updateData.location = {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        };
      }

      // Handle optional photo update
      if (photoBase64 && photoContentType) {
        let photoBuffer = await sharp(Buffer.from(photoBase64, 'base64'))
          .resize({ width: 1024, withoutEnlargement: true })
          .jpeg({ quality: 70 })
          .toBuffer();
        // You can add the size check and re-compression logic here too if needed
        updateData.photo = photoBuffer;
        updateData.photoMime = photoContentType;
      }
      
      // Define the query to ensure users can only update their own submissions (unless admin)
      const query = user.role === 'admin' ? { _id: id } : { _id: id, volunteer: user.id };
      
      const submission = await Submission.findOneAndUpdate(
        query,
        { $set: updateData }, // Use $set to update only provided fields
        { new: true, runValidators: true } // Return the updated doc and run schema validation
      );
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found or you do not have permission to edit it.' });
      }
      
      res.status(200).json({ success: true, message: 'Submission updated successfully', data: submission });
    } catch (err) {
      console.error(`[SUBMISSION][PUT][${id}] Error updating submission:`, err);
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation failed', details: err.errors });
      }
      res.status(500).json({ error: 'Failed to update submission' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

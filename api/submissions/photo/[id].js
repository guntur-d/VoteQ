// api/submissions/photo/[id].js - Serve submission photos
import dbConnect from '../../../lib/db.js';
import Submission from '../../../lib/models/Submission.js';
import { requireAuth } from '../../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'GET') {
    try {
      // Get the submission ID from the URL
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Submission ID is required' });
      }

      // Find the submission
      const submission = await Submission.findById(id);
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      // Optional: Add authentication check (uncomment if needed)
      // const user = requireAuth(req, res);
      // if (!user) return;
      // 
      // // Check if user owns this submission or is admin
      // if (user.role !== 'admin' && submission.volunteer.toString() !== user.id) {
      //   return res.status(403).json({ error: 'Access denied' });
      // }

      // Check if photo exists
      if (!submission.photo || submission.photo.length === 0) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      // Set appropriate headers for image response
      const mimeType = submission.photoMime || submission.photoContentType || 'image/jpeg';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      
      // Send the photo buffer
      res.status(200).send(submission.photo);

    } catch (error) {
      console.error('[PHOTO] Error serving photo:', error);
      
      // Handle invalid ObjectId
      if (error.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid submission ID' });
      }
      
      res.status(500).json({ error: 'Server error while serving photo' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

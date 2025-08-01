// api/submissions/photo/[id].js - Photo Serving Endpoint
import dbConnect from '../../../lib/db.js';
import Submission from '../../../lib/models/Submission.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  await dbConnect();
  
  const { id } = req.query;

  try {
    const submission = await Submission.findById(id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    if (!submission.photo || submission.photo.length === 0) {
      return res.status(404).json({ error: 'No photo found for this submission' });
    }
    
    // Set appropriate headers
    const contentType = submission.photoMime || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Content-Length', submission.photo.length);
    
    // Send the binary photo data
    res.status(200).send(submission.photo);
    
  } catch (error) {
    console.error('Error serving photo:', error);
    res.status(500).json({ error: 'Failed to serve photo' });
  }
}
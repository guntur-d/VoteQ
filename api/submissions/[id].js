// pages/api/submissions/[id].js - Fixed Photo Update Logic
import dbConnect from '../../lib/db.js';
import Submission from '../../lib/models/Submission.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const submission = await Submission.findById(id);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      // Convert binary photo to hasPhoto flag for frontend
      const submissionData = submission.toObject();
      if (submission.photo && submission.photo.length > 0) {
        submissionData.hasPhoto = true;
        // Don't send the actual photo data in the response, just the flag
        delete submissionData.photo;
      }
      
      res.status(200).json(submissionData);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  }
  
  else if (req.method === 'PUT') {
    try {
      // Require authentication for updates
      const user = requireAuth(req, res);
      if (!user) return; // requireAuth already sent error response
      
      const updateData = { ...req.body };
      
      // Handle photo update logic
      if (updateData.photoBase64) {
        console.log('[API] Processing photo update...');
        
        // Extract base64 data and content type
        const base64String = updateData.photoBase64;
        let contentType, base64Data;
        
        if (base64String.startsWith('data:')) {
          // Format: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...
          const [header, data] = base64String.split(',');
          contentType = header.match(/:(.*?);/)[1];
          base64Data = data;
        } else {
          // Assume it's just the base64 data without header
          base64Data = base64String;
          contentType = 'image/jpeg'; // Default fallback
        }
        
        // Convert base64 to Buffer
        const binaryData = Buffer.from(base64Data, 'base64');
        
        updateData.photo = binaryData;
        updateData.photoMime = contentType;
        
        console.log(`[API] Photo processed: ${contentType}, ${binaryData.length} bytes`);
      } else if (updateData.removePhoto === true) {
        console.log('[API] Removing photo...');
        updateData.photo = null;
        updateData.photoMime = null;
      }
      
      // Clean up temporary fields
      delete updateData.photoBase64;
      delete updateData.removePhoto;
      
      // Update the submission
      const updatedSubmission = await Submission.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!updatedSubmission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      // Return response without binary photo data
      const responseData = updatedSubmission.toObject();
      if (responseData.photo) {
        responseData.hasPhoto = true;
        delete responseData.photo; // Don't send binary data back
      }
      
      console.log('[API] Submission updated successfully');
      res.status(200).json(responseData);
      
    } catch (error) {
      console.error('Error updating submission:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        for (let field in error.errors) {
          validationErrors[field] = error.errors[field].message;
        }
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        });
      }
      
      res.status(500).json({ error: 'Failed to update submission' });
    }
  }
  
  else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
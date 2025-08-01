// debug/test-photo-update.js - Photo Update Debug Script
// Run this with: node debug/test-photo-update.js <submission_id>

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import your models
import Submission from '../lib/models/Submission.js';

async function testPhotoUpdate(submissionId, testImagePath) {
  try {
    // Explicitly check for environment variables
    if (!process.env.MONGO_URI || !process.env.DB_NAME) {
      console.error('❌ MONGO_URI or DB_NAME not found in .env file. Please check your configuration.');
      process.exit(1);
    }

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME
    });
    console.log('✅ Database connected');

    // Find the submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      console.error('❌ Submission not found');
      process.exit(1);
    }
    
    console.log('📄 Found submission:', {
      id: submission._id,
      tps: submission.tps,
      hasPhoto: submission.photo ? submission.photo.length : 0,
      photoMime: submission.photoMime
    });

    if (testImagePath && fs.existsSync(testImagePath)) {
      // Test photo update
      console.log('🖼️  Updating photo from:', testImagePath);
      
      const imageBuffer = fs.readFileSync(testImagePath);
      const ext = path.extname(testImagePath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      
      // Update submission with new photo
      submission.photo = imageBuffer;
      submission.photoMime = mimeType;
      await submission.save();
      
      console.log('✅ Photo updated successfully');
      console.log('📊 New photo info:', {
        size: imageBuffer.length,
        mimeType: mimeType
      });
    }

    // Test photo retrieval
    const updatedSubmission = await Submission.findById(submissionId);
    if (updatedSubmission.photo && updatedSubmission.photo.length > 0) {
      console.log('✅ Photo retrieval test passed');
      console.log('📊 Retrieved photo info:', {
        size: updatedSubmission.photo.length,
        mimeType: updatedSubmission.photoMime
      });
      
      // Optionally save the photo to verify it's correct
      const outputPath = `debug/retrieved-photo-${submissionId}.jpg`;
      fs.writeFileSync(outputPath, updatedSubmission.photo);
      console.log('💾 Photo saved to:', outputPath);
    } else {
      console.log('❌ No photo found in submission');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Get command line arguments
const submissionId = process.argv[2];
const testImagePath = process.argv[3];

if (!submissionId) {
  console.log('Usage: node debug/test-photo-update.js <submission_id> [test_image_path]');
  console.log('Example: node debug/test-photo-update.js 507f1f77bcf86cd799439011 test-image.jpg');
  process.exit(1);
}

console.log('🚀 Starting photo update test...');
testPhotoUpdate(submissionId, testImagePath);
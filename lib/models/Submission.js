// lib/models/Submission.js
import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  tps: { type: String, required: true },
  village: { type: String, required: true },
  district: { type: String, required: true },
  totalVotes: { type: Number, required: true },
  calegVotes: { type: Number, required: true },
  photo: { type: Buffer },
  photoContentType: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  status: { type: String, enum: ['pending', 'approved', 'flagged'], default: 'pending' }
}, { timestamps: true });

export default mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

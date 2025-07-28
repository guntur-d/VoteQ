import mongoose from 'mongoose';
const SubmissionSchema = new mongoose.Schema({
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' },
  outcome: { type: String, enum: ['win', 'loss'] },
  votes: Number,
  photo: Buffer, // Compressed image as BLOB
  photoMime: String,
  gps: { lat: Number, lng: Number },
  tpsNumber: String,
  village: String,
  district: String,
  approved: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});
export default mongoose.model('Submission', SubmissionSchema);

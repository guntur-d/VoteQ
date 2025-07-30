import mongoose from 'mongoose';
const SubmissionSchema = new mongoose.Schema({
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' },
  votes: Number,
  photo: Buffer, // Compressed image as BLOB
  photoMime: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: false
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false
    }
  },
  tpsNumber: String,
  village: String,
  district: String,
  provinsiCode: String,
  kabupatenKotaCode: String,
  kecamatanCode: String,
  kelurahanDesaCode: String,
  approved: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});
SubmissionSchema.index({ location: '2dsphere' });
export default mongoose.model('Submission', SubmissionSchema);

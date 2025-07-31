// lib/models/Submission.js
import mongoose from 'mongoose';


const SubmissionSchema = new mongoose.Schema({
  // Legacy/compat fields
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
  timestamp: { type: Date, default: Date.now },

  // New fields (from SPA/serverless)
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' },
  tps: String,
  totalVotes: Number,
  calegVotes: Number,
  photoContentType: String,
  latitude: Number,
  longitude: Number,
  status: { type: String, enum: ['pending', 'approved', 'flagged'], default: 'pending' }
}, { timestamps: true });

// Ensure unique TPS number per full area (provinsi, kabupaten/kota, kecamatan, kelurahan/desa)
SubmissionSchema.index({ provinsiCode: 1, kabupatenKotaCode: 1, kecamatanCode: 1, kelurahanDesaCode: 1, tpsNumber: 1 }, { unique: true });

export default mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

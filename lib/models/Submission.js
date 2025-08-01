// lib/models/Submission.js
import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  // Volunteer who made the submission
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', index: true },
  
 

  // TPS (Tempat Pemungutan Suara - Polling Station) Information
  tps: { type: String }, // TPS number, e.g., "001", "023"
  tpsNumber: { type: String }, // Legacy field compatibility

  // Area codes for uniqueness and querying
  provinsiCode: { type: String },
  kabupatenKotaCode: { type: String },
  kecamatanCode: { type: String },
  kelurahanDesaCode: { type: String },

  // Legacy area fields
  village: { type: String },
  district: { type: String },

  // Vote counts
  totalVotes: { type: Number, min: 0 },
  calegVotes: { type: Number, min: 0 },
  votes: { type: Number }, // Legacy field compatibility

  // Photo evidence (compressed and stored in DB)
  photo: { type: Buffer },
  photoMime: { type: String }, // e.g., 'image/jpeg'

  // Geolocation using standard GeoJSON
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  },

  // Moderation status
  status: {
    type: String,
    enum: ['pending', 'approved', 'flagged'],
    default: 'pending',
    index: true
  },
  
  // Legacy status fields
  approved: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'submissions' });

// Ensure unique TPS number per Kelurahan/Desa for data integrity.
SubmissionSchema.index({ kelurahanDesaCode: 1, tps: 1 }, { unique: true, sparse: true });

// Add a geospatial index to efficiently query by location.
SubmissionSchema.index({ location: '2dsphere' });

export default mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

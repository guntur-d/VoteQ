// lib/models/Volunteer.js
import mongoose from 'mongoose';

const VolunteerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'volunteer'], default: 'volunteer' },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Volunteer || mongoose.model('Volunteer', VolunteerSchema);

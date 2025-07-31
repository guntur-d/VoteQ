// lib/models/Volunteer.js
import mongoose from 'mongoose';


const VolunteerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'volunteer'], default: 'volunteer' },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Volunteer || mongoose.model('Volunteer', VolunteerSchema);

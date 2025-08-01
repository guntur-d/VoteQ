// lib/models/Volunteer.js
import mongoose from 'mongoose';


const VolunteerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Assuming you hash this before saving
  role: { type: String, enum: ['admin', 'volunteer'], default: 'volunteer' },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true, collection: 'volunteers' });

export default mongoose.models.Volunteer || mongoose.model('Volunteer', VolunteerSchema);

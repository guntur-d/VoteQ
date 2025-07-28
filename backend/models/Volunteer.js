import mongoose from 'mongoose';
const VolunteerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ['volunteer', 'admin'], default: 'volunteer' },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Volunteer', VolunteerSchema);

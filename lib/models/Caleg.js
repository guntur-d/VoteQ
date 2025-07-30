// lib/models/Caleg.js
import mongoose from 'mongoose';

const CalegSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  name: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.Caleg || mongoose.model('Caleg', CalegSchema);

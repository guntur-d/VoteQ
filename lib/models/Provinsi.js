// lib/models/Provinsi.js
import mongoose from 'mongoose';

const ProvinsiSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true }
}, { collection: 'provinsis' });

export default mongoose.models.Provinsi || mongoose.model('Provinsi', ProvinsiSchema);

// lib/models/Kecamatan.js
import mongoose from 'mongoose';

const KecamatanSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  kabupatenCode: { type: String, required: true },
  provinsiCode: { type: String, required: true }
}, { collection: 'kecamatans' });

export default mongoose.models.Kecamatan || mongoose.model('Kecamatan', KecamatanSchema);

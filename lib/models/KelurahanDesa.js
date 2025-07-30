// lib/models/KelurahanDesa.js
import mongoose from 'mongoose';

const KelurahanDesaSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  kecamatanCode: { type: String, required: true },
  kabupatenCode: { type: String, required: true },
  provinsiCode: { type: String, required: true }
}, { collection: 'kelurahandesa' });

export default mongoose.models.KelurahanDesa || mongoose.model('KelurahanDesa', KelurahanDesaSchema);

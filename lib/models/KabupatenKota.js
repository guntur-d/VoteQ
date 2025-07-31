// lib/models/KabupatenKota.js
import mongoose from 'mongoose';

const KabupatenKotaSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  provinsiCode: { type: String, required: true },
  provinsiName: { type: String }
}, { collection: 'kabupatenkotas' });

export default mongoose.models.KabupatenKota || mongoose.model('KabupatenKota', KabupatenKotaSchema);

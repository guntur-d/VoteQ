// lib/models/AreaSetting.js
import mongoose from 'mongoose';

const AreaSettingSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  provinsi: { type: String, required: true },
  kabupatenKota: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.AreaSetting || mongoose.model('AreaSetting', AreaSettingSchema);

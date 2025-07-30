import mongoose from 'mongoose';

const AreaSettingSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  provinsi: { type: String, required: true },
  kabupatenKota: { type: String, required: true },
 
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AreaSetting', AreaSettingSchema);

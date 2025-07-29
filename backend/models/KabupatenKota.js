import mongoose from 'mongoose';

const KabupatenKotaSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  provinsiCode: { type: String, required: true },
  provinsiName: { type: String }
});

export default mongoose.model('KabupatenKota', KabupatenKotaSchema);

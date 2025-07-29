import mongoose from 'mongoose';

const KecamatanSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  provinsiCode: { type: String, required: true },
  kabupatenCode: { type: String, required: true },
  kabupatenName: { type: String },
  provinsiName: { type: String }
});

export default mongoose.model('Kecamatan', KecamatanSchema);

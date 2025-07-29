import mongoose from 'mongoose';

const KelurahanDesaSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  provinsiCode: { type: String, required: true },
  kabupatenCode: { type: String, required: true },
  kecamatanCode: { type: String, required: true },
  kabupatenName: { type: String },
  kecamatanName: { type: String },
  provinsiName: { type: String }
});

export default mongoose.model('KelurahanDesa', KelurahanDesaSchema);

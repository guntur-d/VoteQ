import mongoose from 'mongoose';

const CalegSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Caleg', CalegSchema);

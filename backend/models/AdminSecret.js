import mongoose from 'mongoose';

const AdminSecretSchema = new mongoose.Schema({
  hash: { type: String, required: true }, // bcrypt hash of the secret code
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AdminSecret', AdminSecretSchema);

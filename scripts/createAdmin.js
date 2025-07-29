// scripts/createAdmin.js
// Usage: node scripts/createAdmin.js <secret> <name> <email> <password>
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Volunteer from '../backend/models/Volunteer.js';
import AdminSecret from '../backend/models/AdminSecret.js';

dotenv.config({ path: '.env' });

const [,, secret, name, email, password] = process.argv;

if (!secret || !name || !email || !password) {
  console.error('Usage: node scripts/createAdmin.js <secret> <name> <email> <password>');
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI + process.env.DB_NAME);
  const adminSecret = await AdminSecret.findOne();
  if (!adminSecret) {
    console.error('No admin secret set. Please set the secret first.');
    process.exit(1);
  }
  const valid = await bcrypt.compare(secret, adminSecret.hash);
  if (!valid) {
    console.error('Invalid secret.');
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await Volunteer.findOne({ email });
  if (existing) {
    console.error('Admin with this email already exists.');
    process.exit(1);
  }
  await Volunteer.create({ name, email, passwordHash, role: 'admin', verified: true });
  console.log('Admin user created successfully.');
  process.exit(0);
}

main();

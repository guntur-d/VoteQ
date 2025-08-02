// scripts/createAdmin.js
// Usage: node scripts/createAdmin.js <secret> <name> <email> <phoneNumber> <password>
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Volunteer from '../lib/models/Volunteer.js';
import AdminSecret from '../lib/models/AdminSecret.js';

dotenv.config({ path: '.env' });

const [,, secret, name, email, phoneNumber, password] = process.argv;

if (!secret || !name || !email || !phoneNumber || !password) {
  console.error('Usage: node scripts/createAdmin.js <secret> <name> <email> <phoneNumber> <password>');
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, process.env.DB_NAME ? { dbName: process.env.DB_NAME } : undefined);
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
  await Volunteer.create({
    fullName: name,
    email,
    phoneNumber,
    password: passwordHash,
    role: 'admin',
    isVerified: true
  });
  console.log('Admin user created successfully.');
  process.exit(0);
}

main();

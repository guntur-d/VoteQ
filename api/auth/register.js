// /api/auth/register.js - User registration API
import dbConnect from '../../lib/db.js';
import Volunteer from '../../lib/models/Volunteer.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'POST') {
    try {
      const { fullName, phoneNumber, password } = req.body;
      
      if (!fullName || !phoneNumber || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      // Check if user already exists
      const existingUser = await Volunteer.findOne({ phoneNumber });
      if (existingUser) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = new Volunteer({
        fullName,
        phoneNumber,
        password: hashedPassword,
        role: 'volunteer',
        isVerified: false
      });
      
      await user.save();
      
      res.status(201).json({ message: 'Registration successful. Please wait for admin verification.' });
    } catch (err) {
      res.status(500).json({ error: 'Registration failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

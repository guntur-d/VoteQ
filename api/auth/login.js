// /api/auth/login.js - User login API
import dbConnect from '../../lib/db.js';
import Volunteer from '../../lib/models/Volunteer.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'POST') {
    try {
      const { phoneNumber, password } = req.body;
      
      if (!phoneNumber || !password) {
        return res.status(400).json({ error: 'Phone number and password are required' });
      }
      
      // Find user
      const user = await Volunteer.findOne({ phoneNumber });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check if user is verified
      if (!user.isVerified) {
        return res.status(403).json({ error: 'Account not yet verified by admin' });
      }
      
      // Generate token
      const token = signToken({
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role
      });
      
      res.status(200).json({
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          role: user.role
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// /api/auth/login.js - User login API
import dbConnect from '../../lib/db.js';
import Volunteer from '../../lib/models/Volunteer.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;
      console.log('[LOGIN] Incoming login request:', { email });

      if (!email || !password) {
        console.log('[LOGIN] Missing email or password');
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user by email
      const user = await Volunteer.findOne({ email });
      if (!user) {
        console.log('[LOGIN] User not found for email:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      console.log('[LOGIN] User found:', { id: user._id, verified: user.verified });

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        console.log('[LOGIN] Invalid password for user:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      console.log('[LOGIN] Password valid for user:', email);

      // Check if user is verified
      if (!user.verified) {
        console.log('[LOGIN] User not verified:', email);
        return res.status(403).json({ error: 'Account not yet verified by admin' });
      }
      console.log('[LOGIN] User is verified:', email);

      // Generate token
      const token = signToken({
        id: user._id,
        email: user.email,
        role: user.role
      });
      console.log('[LOGIN] Token generated for user:', email);

      res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error('[LOGIN] Error during login:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

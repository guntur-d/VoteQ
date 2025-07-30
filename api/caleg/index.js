// /api/caleg/index.js - Caleg API
import dbConnect from '../../lib/db.js';
import Caleg from '../../lib/models/Caleg.js';
import { requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'GET') {
    const user = requireAdmin(req, res);
    if (!user) return;
    
    try {
      const caleg = await Caleg.findOne({ admin: user.id });
      res.status(200).json(caleg);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch caleg' });
    }
  } else if (req.method === 'POST') {
    const user = requireAdmin(req, res);
    if (!user) return;
    
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      // Upsert caleg
      const caleg = await Caleg.findOneAndUpdate(
        { admin: user.id },
        { name },
        { upsert: true, new: true }
      );
      
      res.status(200).json(caleg);
    } catch (err) {
      res.status(500).json({ error: 'Failed to save caleg' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

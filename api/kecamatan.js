// /api/kecamatan.js - Kecamatan list API
import dbConnect from '../lib/db.js';
import Kecamatan from '../lib/models/Kecamatan.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'GET') {
    try {
      const { kabupatenCode, provinsiCode } = req.query;
      if (!kabupatenCode || !provinsiCode) {
        return res.status(400).json({ error: 'kabupatenCode and provinsiCode are required' });
      }
      
      const list = await Kecamatan.find({ kabupatenCode, provinsiCode }, { _id: 0, code: 1, name: 1 });
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch kecamatan' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

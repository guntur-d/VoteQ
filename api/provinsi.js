// /api/provinsi.js - Vercel serverless API example for Provinsi list
import dbConnect from '../lib/db.js';
import Provinsi from '../lib/models/Provinsi.js';

export default async function handler(req, res) {
  await dbConnect();
  if (req.method === 'GET') {
    try {
      const list = await Provinsi.find({}, { _id: 0, code: 1, name: 1 });
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch provinsi' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// /api/kabupatenkota.js - Kabupaten/Kota list API
import dbConnect from '../lib/db.js';
import KabupatenKota from '../lib/models/KabupatenKota.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'GET') {
    try {
      const { provinsiCode } = req.query;
    //  console.log('Fetching kabupaten/kota for provinsiCode:', provinsiCode);
   //  console.log(typeof provinsiCode)
    //  console.log('Request query:', req.query);
      if (!provinsiCode) {
        return res.status(400).json({ error: 'provinsiCode is required' });
      }
      
      const list = await KabupatenKota.find({ provinsiCode }, { _id: 0, code: 1, name: 1 });
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch kabupaten/kota' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// /api/kelurahan_desa.js - Kelurahan/Desa list API
import dbConnect from '../lib/db.js';
import KelurahanDesa from '../lib/models/KelurahanDesa.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'GET') {
    try {
      const { provinsiCode, kabupatenCode, kecamatanCode } = req.query;
      if (!provinsiCode || !kabupatenCode || !kecamatanCode) {
        return res.status(400).json({ error: 'provinsiCode, kabupatenCode, and kecamatanCode are required' });
      }
      
      const list = await KelurahanDesa.find({ provinsiCode, kabupatenCode, kecamatanCode }, { _id: 0, code: 1, name: 1 });
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch kelurahan/desa' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

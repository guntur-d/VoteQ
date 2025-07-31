// /api/admin/area-setting.js - Area setting API
import dbConnect from '../../lib/db.js';
import AreaSetting from '../../lib/models/AreaSetting.js';
import { requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'GET') {
    const user = requireAdmin(req, res);
    if (!user) return;
    try {
      const setting = await AreaSetting.findOne();
      if (!setting) {
        return res.status(404).json({ error: 'Area setting not found' });
      }
      res.status(200).json(setting);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch area setting' });
    }
  } else if (req.method === 'POST') {
    const user = requireAdmin(req, res);
    if (!user) return;
    try {
      const { provinsi, kabupatenKota, admin } = req.body;
      if (!provinsi || !kabupatenKota || !admin) {
        return res.status(400).json({ error: 'Provinsi, kabupatenKota, and admin are required' });
      }
      // Overwrite or create single area setting with admin info
      await AreaSetting.deleteMany({});
      const setting = await AreaSetting.create({ provinsi, kabupatenKota, admin });
      res.status(200).json(setting);
    } catch (err) {
      res.status(500).json({ error: 'Failed to save area setting' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// /api/export/csv.js - Export submissions as CSV
import dbConnect from '../../lib/db.js';
import Submission from '../../lib/models/Submission.js';
import { requireAdmin } from '../../lib/auth.js';
import { Parser } from 'json2csv';

export default async function handler(req, res) {
  await dbConnect();
  
  if (req.method === 'GET') {
    const user = requireAdmin(req, res);
    if (!user) return;
    
    try {
      const submissions = await Submission.find({})
        .populate('volunteer', 'fullName phoneNumber')
        .lean();
      
      // Transform data for CSV
      const csvData = submissions.map(sub => ({
        'Tanggal': new Date(sub.createdAt).toLocaleDateString('id-ID'),
        'Volunteer': sub.volunteer?.fullName || 'Unknown',
        'No. HP': sub.volunteer?.phoneNumber || '',
        'TPS': sub.tps,
        'Desa/Kelurahan': sub.village,
        'Kecamatan': sub.district,
        'Total Suara': sub.totalVotes,
        'Suara Caleg': sub.calegVotes,
        'Status': sub.status,
        'Latitude': sub.latitude || '',
        'Longitude': sub.longitude || ''
      }));
      
      const parser = new Parser();
      const csv = parser.parse(csvData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
      res.status(200).send(csv);
    } catch (err) {
      res.status(500).json({ error: 'Failed to export CSV' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

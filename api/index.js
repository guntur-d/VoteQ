// /api/index.js - Main API handler for Vercel
// This handles the root /api route and can serve as a health check

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ 
      message: 'VoteQ API is running on Vercel',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
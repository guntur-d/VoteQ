// /api/admin/submissions.js - Get all submissions for admin
import dbConnect from '../../lib/db.js';
import Submission from '../../lib/models/Submission.js';
import Volunteer from '../../lib/models/Volunteer.js';
import { requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  try {
    await dbConnect();
    
    if (req.method === 'GET') {
      const user = requireAdmin(req, res);
      if (!user) return;
      
      console.log('Admin user authenticated:', user.email || user.id);
      
      // First, let's check what fields exist in the Volunteer model
      const sampleVolunteer = await Volunteer.findOne({}).lean();
      console.log('Sample volunteer fields:', Object.keys(sampleVolunteer || {}));
      
      // Try different possible field names for volunteer name
      const submissions = await Submission.find({})
        .populate('volunteer', 'name email phoneNumber') // Include multiple possible fields
        .select('-photo') // Exclude the large photo buffer for performance
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`Found ${submissions.length} submissions`);
      
      if (submissions.length > 0) {
        console.log('First submission volunteer after populate:', submissions[0].volunteer);
      }
      
      // Normalize the volunteer data
      const normalizedSubmissions = submissions.map(sub => {
        let volunteerName = 'Unknown User';
        
        if (sub.volunteer && typeof sub.volunteer === 'object') {
          // Try different possible field names
          volunteerName = sub.volunteer.fullName || 
                         sub.volunteer.name || 
                         sub.volunteer.email || 
                         sub.volunteer.phoneNumber ||
                         `User ${sub.volunteer._id}`;
        }
        
        return {
          ...sub,
          volunteerDisplayName: volunteerName, // Add a clear field for frontend
          hasPhoto: !!sub.photoMime // Add a flag to indicate photo presence
        };
      });
      
      console.log('Sending normalized submissions with volunteerDisplayName');
      res.status(200).json(normalizedSubmissions);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Error in admin submissions handler:', err);
    res.status(500).json({ error: 'Failed to fetch submissions', details: err.message });
  }
}

# VoteQ Backend Migration to Vercel Serverless

## Migration Summary

Your backend has been successfully restructured for Vercel serverless deployment. Here's what has been created:

### Core Infrastructure
- `lib/db.js` - MongoDB connection utility (singleton pattern for serverless)
- `lib/auth.js` - JWT authentication utilities
- `lib/models/` - All Mongoose models converted for serverless

### API Endpoints Created
- `/api/index.js` - Health check endpoint
- `/api/provinsi.js` - Get provinces
- `/api/kabupatenkota.js` - Get regencies/cities by province
- `/api/kecamatan.js` - Get districts by regency + province
- `/api/kelurahan_desa.js` - Get villages by district + regency + province
- `/api/auth/register.js` - User registration
- `/api/auth/login.js` - User login
- `/api/admin/area-setting.js` - Admin area configuration
- `/api/admin/unverified-users.js` - Get unverified users
- `/api/admin/verify-user/[id].js` - Verify specific user
- `/api/admin/submissions.js` - Get all submissions (admin only)
- `/api/admin/approve/[id].js` - Approve submission
- `/api/admin/flag/[id].js` - Flag submission
- `/api/caleg/index.js` - Caleg (candidate) management
- `/api/submissions/index.js` - Create/list submissions
- `/api/submissions/mine.js` - Get user's own submissions
- `/api/submissions/[id].js` - Get/update specific submission
- `/api/export/csv.js` - Export submissions as CSV

### Package.json Updates
- Removed Fastify dependencies
- Added `jsonwebtoken` for JWT handling
- Updated scripts to use Vercel

## Environment Variables Needed
Make sure these are set in your Vercel project:
- `MONGO_URI` - MongoDB connection string
- `DB_NAME` - Database name (optional)
- `JWT_SECRET` - JWT signing secret

## Next Steps
1. Deploy to Vercel: `vercel --prod`
2. Test all API endpoints
3. Update frontend URLs if needed (should work as-is)
4. Remove the `backend/` folder once everything is working

## Testing Locally
Run `vercel dev` to test the serverless functions locally.

All your existing functionality has been preserved:
- User registration/login with JWT
- Admin verification workflow
- Area and caleg settings
- Submission CRUD operations
- CSV export
- Proper authentication and authorization

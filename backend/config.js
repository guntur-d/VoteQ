import dotenv from 'dotenv';
dotenv.config();
export default {
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'changeme',
  port: process.env.PORT || 3000
};

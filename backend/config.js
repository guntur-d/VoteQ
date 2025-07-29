import dotenv from 'dotenv';
dotenv.config();
export default {
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.DB_NAME,
  jwtSecret: process.env.JWT_SECRET || 'changeme',
  port: process.env.PORT || 3000
};

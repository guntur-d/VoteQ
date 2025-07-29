import fastify from 'fastify';
import mongoose from 'mongoose';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import staticPlugin from '@fastify/static';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';

import areaSettingController from './controllers/areaSettingController.js';
import authRoutes from './routes/auth.js';
import submissionRoutes from './routes/submissions.js';
import adminRoutes from './routes/admin.js';

import exportRoutes from './routes/export.js';
import provinsiRoutes from './routes/provinsi.js';
import kabupatenKotaRoutes from './routes/kabupatenkota.js';
import calegRoutes from './routes/caleg.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify({ logger: true });

await mongoose.connect(config.mongoUri, config.dbName ? { dbName: config.dbName } : undefined);

await app.register(cors);
await app.register(jwt, { secret: config.jwtSecret });
await app.register(staticPlugin, {
  root: path.join(__dirname, '../frontend'),
  prefix: '/',
});
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(submissionRoutes, { prefix: '/api/submissions' });
await app.register(adminRoutes, { prefix: '/api/admin' });
await app.register(exportRoutes, { prefix: '/api/export' });
await app.register(provinsiRoutes, { prefix: '/api/provinsi' });
await app.register(kabupatenKotaRoutes, { prefix: '/api/kabupatenkota' });
await app.register(calegRoutes, { prefix: '/api/caleg' });

app.listen({ port: config.port, host: '0.0.0.0' }, err => {
  if (err) throw err;
  app.log.info(`Server running on port ${config.port}`);
});

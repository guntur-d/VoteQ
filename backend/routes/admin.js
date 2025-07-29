

import areaSettingController from '../controllers/areaSettingController.js';
import adminController from '../controllers/adminController.js';
import adminSecretController from '../controllers/adminSecretController.js';

import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';

export default async function routes(fastify) {
  // Admin secret endpoints
  fastify.post('/set-secret', adminSecretController.setSecret); // For initial setup only
  fastify.post('/verify-secret', adminSecretController.verifySecret);

  // Area setting endpoints (JWT + admin only)
  fastify.get('/area-setting', { preHandler: [auth, adminOnly] }, areaSettingController.get);
  fastify.post('/area-setting', { preHandler: [auth, adminOnly] }, areaSettingController.save);
  fastify.get('/submissions', { preHandler: [auth, adminOnly] }, adminController.list);
  fastify.get('/unverified-users', { preHandler: [auth, adminOnly] }, adminController.unverifiedUsers);
  fastify.post('/verify-user/:id', { preHandler: [auth, adminOnly] }, adminController.verifyUser);
  fastify.post('/approve/:id', { preHandler: [auth, adminOnly] }, adminController.approve);
  fastify.post('/flag/:id', { preHandler: [auth, adminOnly] }, adminController.flag);
}

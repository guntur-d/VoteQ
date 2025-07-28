import adminController from '../controllers/adminController.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';
export default async function routes(fastify) {
  fastify.get('/summary', { preHandler: [auth, adminOnly] }, adminController.summary);
  fastify.get('/submissions', { preHandler: [auth, adminOnly] }, adminController.list);
  fastify.post('/approve/:id', { preHandler: [auth, adminOnly] }, adminController.approve);
  fastify.post('/flag/:id', { preHandler: [auth, adminOnly] }, adminController.flag);
}

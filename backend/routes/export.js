import exportController from '../controllers/exportController.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';
export default async function routes(fastify) {
  fastify.get('/csv', { preHandler: [auth, adminOnly] }, exportController.csv);
}

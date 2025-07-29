import calegController from '../controllers/calegController.js';
import auth from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';

export default async function routes(fastify) {
  fastify.get('/', calegController.get);
  fastify.post('/', { preHandler: [auth, adminOnly] }, calegController.set);
}

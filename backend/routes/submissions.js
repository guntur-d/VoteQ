import submissionController from '../controllers/submissionController.js';
import auth from '../middleware/auth.js';
export default async function routes(fastify) {
  fastify.post('/', { preHandler: [auth] }, submissionController.create);
  fastify.get('/', { preHandler: [auth] }, submissionController.list);
  fastify.get('/:id/photo', { preHandler: [auth] }, submissionController.getPhoto);
}

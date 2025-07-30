import submissionController from '../controllers/submissionController.js';
import auth from '../middleware/auth.js';
export default async function routes(fastify) {
  fastify.post('/', { preHandler: [auth], handler: submissionController.create });
  fastify.get('/', { preHandler: [auth], handler: submissionController.list }); // For admin panel
  fastify.get('/mine', { preHandler: [auth], handler: submissionController.listMine });
  fastify.get('/mine/by-tps', { preHandler: [auth], handler: submissionController.getMineByTps });
  fastify.get('/:id', { preHandler: [auth], handler: submissionController.get }); // For editing
  fastify.get('/:id/photo', { preHandler: [auth], handler: submissionController.getPhoto });
  fastify.put('/:id', { preHandler: [auth], handler: submissionController.update });
}

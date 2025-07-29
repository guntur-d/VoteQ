import provinsiController from '../controllers/provinsiController.js';

export default async function routes(fastify) {
  fastify.get('/', provinsiController.list);
}

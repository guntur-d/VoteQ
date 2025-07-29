import kabupatenKotaController from '../controllers/kabupatenKotaController.js';

export default async function routes(fastify) {
  fastify.get('/', kabupatenKotaController.listByProvinsi);
}

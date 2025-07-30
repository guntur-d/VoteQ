import kelurahanDesaController from '../controllers/kelurahanDesaController.js';

export default async function routes(fastify) {
  fastify.get('/', kelurahanDesaController.listByKecamatan);
}

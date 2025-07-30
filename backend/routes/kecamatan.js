import kecamatanController from '../controllers/kecamatanController.js';

export default async function routes(fastify) {
  fastify.get('/', kecamatanController.listByKabupaten);
}

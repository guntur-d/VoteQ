import authController from '../controllers/authController.js';
export default async function routes(fastify) {
  fastify.post('/register', authController.register);
  fastify.post('/login', authController.login);
}

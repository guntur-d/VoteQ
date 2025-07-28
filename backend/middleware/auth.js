export default async function (req, reply) {
  try {
    // Fastify automatically parses and verifies JWT if @fastify/jwt is registered
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

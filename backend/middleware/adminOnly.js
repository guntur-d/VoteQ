export default async function (req, reply) {
  if (!req.user || req.user.role !== 'admin') {
    return reply.code(403).send({ error: 'Forbidden' });
  }
}

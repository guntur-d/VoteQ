import Caleg from '../models/Caleg.js';

const calegController = {
  async get(req, reply) {
    const caleg = await Caleg.findOne();
    reply.send(caleg || {});
  },
  async set(req, reply) {
    const { name } = req.body;
    if (!name) return reply.code(400).send({ error: 'Nama caleg wajib diisi' });
    let caleg = await Caleg.findOne();
    if (caleg) {
      caleg.name = name;
      await caleg.save();
    } else {
      caleg = await Caleg.create({ name });
    }
    reply.send(caleg);
  }
};

export default calegController;

import KabupatenKota from '../models/KabupatenKota.js';

const kabupatenKotaController = {
  async listByProvinsi(req, reply) {
    const { provinsiCode } = req.query;
    if (!provinsiCode) return reply.code(400).send({ error: 'provinsiCode is required' });
    const list = await KabupatenKota.find({ provinsiCode }, { _id: 0, code: 1, name: 1 });
  
    reply.send(list);
  }
};

export default kabupatenKotaController;

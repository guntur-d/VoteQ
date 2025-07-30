import Kecamatan from '../models/Kecamatan.js';

const kecamatanController = {
  async listByKabupaten(req, reply) {
    const { kabupatenCode, provinsiCode } = req.query;
    if (!kabupatenCode || !provinsiCode) {
      return reply.code(400).send({ error: 'kabupatenCode and provinsiCode are required' });
    }
    const list = await Kecamatan.find({ kabupatenCode, provinsiCode }, { _id: 0, code: 1, name: 1 }).sort({ name: 1 });
    reply.send(list);
  }
};

export default kecamatanController;

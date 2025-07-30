import KelurahanDesa from '../models/KelurahanDesa.js';

const kelurahanDesaController = {
  async listByKecamatan(req, reply) {
    const { provinsiCode, kabupatenCode, kecamatanCode } = req.query;
    if (!provinsiCode || !kabupatenCode || !kecamatanCode) {
      return reply.code(400).send({ error: 'provinsiCode, kabupatenCode, and kecamatanCode are required' });
    }
    const list = await KelurahanDesa.find({ provinsiCode, kabupatenCode, kecamatanCode }, { _id: 0, code: 1, name: 1 }).sort({ name: 1 });
    reply.send(list);
  }
};

export default kelurahanDesaController;

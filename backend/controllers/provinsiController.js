import Provinsi from '../models/Provinsi.js';

const provinsiController = {
  async list(req, reply) {
    const provinsis = await Provinsi.find({}, { _id: 0, code: 1, name: 1 });
    reply.send(provinsis);
  }
};

export default provinsiController;

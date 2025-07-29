import AreaSetting from '../models/AreaSetting.js';

const areaSettingController = {
  async save(req, reply) {
    const { provinsi, kabupatenKota } = req.body;
    const adminId = req.adminId; // set by adminSecretAccess middleware
    if (!provinsi || !kabupatenKota) {
      return reply.code(400).send({ error: 'Provinsi and Kabupaten/Kota are required.' });
    }
    const setting = await AreaSetting.findOneAndUpdate(
      { admin: adminId },
      { provinsi, kabupatenKota },
      { upsert: true, new: true }
    );
    reply.send(setting);
  },
  async get(req, reply) {
    const adminId = req.adminId;
    const setting = await AreaSetting.findOne({ admin: adminId });
    reply.send(setting || {});
  }
};

export default areaSettingController;

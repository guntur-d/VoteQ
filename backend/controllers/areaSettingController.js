import AreaSetting from '../models/AreaSetting.js';

const areaSettingController = {
  async save(req, reply) {
    console.log('Saving area setting:', req.body);
    const { provinsi, kabupatenKota } = req.body;
    const adminId = req.user && req.user.id;
    if (!provinsi || !kabupatenKota) {
      return reply.code(400).send({ error: 'Provinsi and Kabupaten/Kota are required.' });
    }
    const setting = await AreaSetting.findOneAndUpdate(
      { admin: adminId },
      { provinsi, kabupatenKota, admin: adminId },
      { upsert: true, new: true }
    );
    reply.send(setting);
  },
  async get(req, reply) {
    const adminId = req.user && req.user.id;
    const setting = await AreaSetting.findOne({ admin: adminId });
    reply.send(setting || {});
  }
};

export default areaSettingController;

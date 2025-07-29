import Submission from '../models/Submission.js';
import Volunteer from '../models/Volunteer.js';

const adminController = {
  async summary(req, reply) {
    // TODO: Aggregate votes by district
    reply.send({ message: 'Summary endpoint' });
  },
  async list(req, reply) {
    const submissions = await Submission.find({});
    reply.send(submissions);
  },
  async approve(req, reply) {
    await Submission.findByIdAndUpdate(req.params.id, { approved: true });
    reply.send({ success: true });
  },
  async flag(req, reply) {
    await Submission.findByIdAndUpdate(req.params.id, { flagged: true });
    reply.send({ success: true });
  },
  async unverifiedUsers(req, reply) {
    const users = await Volunteer.find({ verified: false });
    reply.send(users);
  },
  async verifyUser(req, reply) {
    const { id } = req.params;
    await Volunteer.findByIdAndUpdate(id, { verified: true });
    reply.send({ success: true });
  }
};
export default adminController;

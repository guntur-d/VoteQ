import Submission from '../models/Submission.js';

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
  }
};
export default adminController;

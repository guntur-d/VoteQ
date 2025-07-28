import Submission from '../models/Submission.js';
import { Parser } from 'json2csv';

const exportController = {
  async csv(req, reply) {
    const submissions = await Submission.find({});
    const parser = new Parser();
    const csv = parser.parse(submissions.map(s => ({
      ...s.toObject(),
      photo: undefined, // Don't export BLOB
      photoMime: undefined
    })));
    reply.header('Content-Type', 'text/csv').send(csv);
  }
};
export default exportController;

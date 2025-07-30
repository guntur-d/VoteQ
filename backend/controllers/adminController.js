import Submission from '../models/Submission.js';
import Volunteer from '../models/Volunteer.js';

const adminController = {
  async summaryByKecamatan(req, reply) {
    const summary = await Submission.aggregate([
      { $match: { approved: true } }, // Only count approved votes for accuracy
      {
        $group: {
          _id: '$kecamatanCode',
          totalVotes: { $sum: { $toInt: '$votes' } }
        }
      },
      {
        $lookup: {
          from: 'kecamatans', // collection name for Kecamatan model
          localField: '_id',
          foreignField: 'code',
          as: 'kecamatanData'
        }
      },
      {
        $project: {
          _id: 0,
          kecamatanCode: '$_id',
          kecamatanName: { $ifNull: [{ $arrayElemAt: ['$kecamatanData.name', 0] }, 'N/A'] },
          totalVotes: 1
        }
      },
      { $sort: { kecamatanName: 1 } }
    ]);
    reply.send(summary);
  },
  async list(req, reply) {
    const { kecamatanCode, kelurahanDesaCode } = req.query;
    console.log('[Admin] Fetching submissions with filter:', req.query);
    const filter = {};
    if (kecamatanCode) {
      filter.kecamatanCode = kecamatanCode;
    }
    if (kelurahanDesaCode) {
      filter.kelurahanDesaCode = kelurahanDesaCode;
    }

    const submissions = await Submission.find(filter).sort({ timestamp: -1 });

    const totalResult = await Submission.aggregate([
      { $match: { ...filter, approved: true } },
      { $group: { _id: null, total: { $sum: { $toInt: '$votes' } } } }
    ]);

    const totalApprovedVotes = totalResult.length > 0 ? totalResult[0].total : 0;
    console.log('[Admin] Calculated total approved votes:', totalApprovedVotes);

    reply.send({
      submissions,
      totalApprovedVotes
    });
  },
  async approve(req, reply) {
    console.log(`[Admin] Approving submission with ID: ${req.params.id}`);
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

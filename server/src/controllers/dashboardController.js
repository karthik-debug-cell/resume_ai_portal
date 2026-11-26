const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const asyncHandler = require('../utils/asyncHandler');
const { round1 } = require('../utils/helpers');

// GET /api/dashboard/stats  – recruiter analytics
exports.getStats = asyncHandler(async (_req, res) => {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 13);
  since.setUTCHours(0, 0, 0, 0);

  const [facets, openJobs, totalJobs] = await Promise.all([
    Candidate.aggregate([
      {
        $facet: {
          totals: [{ $group: { _id: null, total: { $sum: 1 }, avgScore: { $avg: '$matchScore' } } }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          // Same thresholds as the PHP UI colours: >=70 good, >=40 ok, else low
          byScore: [
            { $bucket: { groupBy: '$matchScore', boundaries: [0, 40, 70, 101], default: 'other', output: { count: { $sum: 1 } } } },
          ],
          byJob: [
            { $match: { job: { $ne: null } } },
            { $group: { _id: '$job', count: { $sum: 1 }, avgScore: { $avg: '$matchScore' } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
            { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
            { $unwind: '$job' },
            { $project: { _id: 0, jobId: '$_id', title: '$job.title', count: 1, avgScore: { $round: ['$avgScore', 1] } } },
          ],
          overTime: [
            { $match: { submittedAt: { $gte: since } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } }, count: { $sum: 1 } } },
          ],
          topCandidates: [
            { $sort: { matchScore: -1, submittedAt: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'job' } },
            { $project: { name: 1, matchScore: 1, status: 1, jobTitle: { $arrayElemAt: ['$job.title', 0] } } },
          ],
          recent: [
            { $sort: { submittedAt: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'job' } },
            { $project: { name: 1, matchScore: 1, status: 1, submittedAt: 1, jobTitle: { $arrayElemAt: ['$job.title', 0] } } },
          ],
        },
      },
    ]),
    Job.countDocuments({ status: 'active' }),
    Job.estimatedDocumentCount(),
  ]);

  const f = facets[0];
  const statusCounts = Object.fromEntries(['pending', 'reviewed', 'shortlisted', 'rejected'].map((s) => [s, 0]));
  f.byStatus.forEach((s) => (statusCounts[s._id] = s.count));

  const bucket = (id) => f.byScore.find((b) => b._id === id)?.count || 0;

  // Fill gaps so the chart always has 14 points
  const timeMap = new Map(f.overTime.map((d) => [d._id, d.count]));
  const overTime = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: timeMap.get(key) || 0 };
  });

  res.json({
    success: true,
    data: {
      totalCandidates: f.totals[0]?.total || 0,
      pending: statusCounts.pending,
      shortlisted: statusCounts.shortlisted,
      avgScore: round1(f.totals[0]?.avgScore || 0),
      openJobs,
      totalJobs,
      statusCounts,
      scoreDistribution: { low: bucket(0), medium: bucket(40), high: bucket(70) },
      applicationsByJob: f.byJob,
      applicationsOverTime: overTime,
      topCandidates: f.topCandidates,
      recentCandidates: f.recent,
    },
  });
});

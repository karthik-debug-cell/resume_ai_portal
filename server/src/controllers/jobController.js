const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/jobs  – all jobs with application counts (admin)
exports.listJobs = asyncHandler(async (_req, res) => {
  const [jobs, counts] = await Promise.all([
    Job.find().sort({ createdAt: -1 }),
    Candidate.aggregate([{ $match: { job: { $ne: null } } }, { $group: { _id: '$job', count: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  const data = jobs.map((j) => ({ ...j.toJSON(), applicationCount: countMap.get(String(j._id)) || 0 }));
  res.json({ success: true, data });
});

// GET /api/jobs/:id
exports.getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new AppError('Job not found', 404);
  res.json({ success: true, data: job });
});

// POST /api/jobs
exports.createJob = asyncHandler(async (req, res) => {
  const job = await Job.create(req.body);
  res.status(201).json({ success: true, message: 'Job added successfully.', data: job });
});

// PUT /api/jobs/:id
exports.updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!job) throw new AppError('Job not found', 404);
  res.json({ success: true, message: 'Job updated.', data: job });
});

// DELETE /api/jobs/:id  – mirrors MySQL `ON DELETE SET NULL`: candidates are kept, their job link is cleared
exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job) throw new AppError('Job not found', 404);
  const { modifiedCount } = await Candidate.updateMany({ job: job._id }, { $set: { job: null } });
  res.json({ success: true, message: 'Job deleted.', data: { detachedCandidates: modifiedCount } });
});

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex } = require('../utils/helpers');
const { screenResume, toCandidateFields } = require('../services/analysisService');
const { UPLOAD_DIR } = require('../middleware/upload');

// GET /api/candidates?search=&job=&status=&minScore=&page=&limit=
exports.listCandidates = asyncHandler(async (req, res) => {
  const { search, job, status, minScore, page, limit } = req.query; // already parsed by zod
  const filter = {};
  if (job) filter.job = job;
  if (status) filter.status = status;
  if (minScore > 0) filter.matchScore = { $gte: minScore };
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [items, total] = await Promise.all([
    Candidate.find(filter)
      .select('-resumeText')
      .populate('job', 'title department')
      .sort({ matchScore: -1, submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Candidate.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } });
});

// GET /api/candidates/:id  – full analysis + resume text
exports.getCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).populate('job');
  if (!candidate) throw new AppError('Candidate not found', 404);
  res.json({ success: true, data: candidate });
});

// PATCH /api/candidates/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true }).select('-resumeText').populate('job', 'title department');
  if (!candidate) throw new AppError('Candidate not found', 404);
  res.json({ success: true, message: 'Status updated', data: candidate });
});

// POST /api/candidates/:id/reanalyze  – re-run screening (e.g. after the job requirements changed)
exports.reanalyze = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) throw new AppError('Candidate not found', 404);
  const job = candidate.job ? await Job.findById(candidate.job) : null;
  if (!job) throw new AppError('This candidate is not linked to an existing job', 400);
  if (!candidate.resumeText) throw new AppError('No resume text available to analyse', 400);

  Object.assign(candidate, toCandidateFields(await screenResume(candidate.resumeText, job)));
  await candidate.save();
  await candidate.populate('job');
  res.json({ success: true, message: 'Analysis refreshed', data: candidate });
});

// GET /api/candidates/:id/resume  – authenticated download (files are not publicly served)
exports.downloadResume = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).select('resumeFile resumeOriginalName name');
  if (!candidate || !candidate.resumeFile) throw new AppError('Resume file not found', 404);

  const filePath = path.join(UPLOAD_DIR, path.basename(candidate.resumeFile)); // basename → no path traversal
  if (!fs.existsSync(filePath)) throw new AppError('Resume file is missing on the server', 404);
  res.download(filePath, candidate.resumeOriginalName || candidate.resumeFile);
});

// DELETE /api/candidates/:id
exports.deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findByIdAndDelete(req.params.id);
  if (!candidate) throw new AppError('Candidate not found', 404);
  if (candidate.resumeFile) await fsp.unlink(path.join(UPLOAD_DIR, path.basename(candidate.resumeFile))).catch(() => {});
  res.json({ success: true, message: 'Candidate deleted' });
});

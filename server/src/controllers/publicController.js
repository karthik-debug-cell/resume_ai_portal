const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { extractResumeText } = require('../services/resumeParser');
const { screenResume, toCandidateFields } = require('../services/analysisService');

// GET /api/public/jobs  – active jobs only (replaces index.php listing)
exports.listActiveJobs = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await Job.find({ status: 'active' }).sort({ createdAt: -1 }) });
});

// GET /api/public/jobs/:id
exports.getActiveJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, status: 'active' });
  if (!job) throw new AppError('Job not found or no longer accepting applications', 404);
  res.json({ success: true, data: job });
});

// GET /api/public/stats  – hero counters (Open Roles / Applicants / Shortlisted)
exports.publicStats = asyncHandler(async (_req, res) => {
  const [openRoles, applicants, shortlisted] = await Promise.all([
    Job.countDocuments({ status: 'active' }),
    Candidate.estimatedDocumentCount(),
    Candidate.countDocuments({ status: 'shortlisted' }),
  ]);
  res.json({ success: true, data: { openRoles, applicants, shortlisted } });
});

// POST /api/public/apply  (multipart/form-data: name, email, phone, jobId, resume)
// Replaces processResume(): save file → extract text → AI screening → store in MongoDB
exports.apply = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please upload your resume (PDF, DOCX or TXT).', 400);

  const { name, email, phone, jobId } = req.body;
  const job = await Job.findOne({ _id: jobId, status: 'active' });
  if (!job) throw new AppError('This job is no longer accepting applications.', 404);

  const resumeText = await extractResumeText(req.file.path);
  if (resumeText.length < 30) {
    throw new AppError('We could not find readable text in this file. If it is a scanned image, please upload a text-based PDF, DOCX or TXT.', 422);
  }

  const result = await screenResume(resumeText, job);

  const candidate = await Candidate.create({
    name,
    email,
    phone,
    job: job._id,
    resumeFile: req.file.filename,
    resumeOriginalName: req.file.originalname,
    resumeText,
    ...toCandidateFields(result),
  });

  res.status(201).json({
    success: true,
    message: 'Resume submitted successfully!',
    data: {
      id: candidate.id,
      score: candidate.matchScore,
      matched: candidate.matchedSkills,
      missing: candidate.missingSkills,
      summary: candidate.analysis.summary,
      recommendation: candidate.analysis.recommendation,
      analysedBy: candidate.analysis.source,
    },
  });
});


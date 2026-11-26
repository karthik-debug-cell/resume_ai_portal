const mongoose = require('mongoose');

const STATUSES = ['pending', 'reviewed', 'shortlisted', 'rejected'];
const RECOMMENDATIONS = ['strong_match', 'good_match', 'partial_match', 'weak_match'];

// Structured AI (or keyword-fallback) analysis stored alongside the candidate
const analysisSchema = new mongoose.Schema(
  {
    summary: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    experienceYears: { type: Number, default: null },
    experienceMeetsRequirement: { type: Boolean, default: null },
    recommendation: { type: String, enum: RECOMMENDATIONS, default: 'partial_match' },
    source: { type: String, enum: ['ai', 'keyword-fallback', 'seed'], default: 'keyword-fallback' },
    model: { type: String, default: null },
    analyzedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Replaces MySQL `candidates`
const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    // MySQL ON DELETE SET NULL is implemented in jobController.deleteJob
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null, index: true },
    resumeFile: { type: String, default: null }, // stored filename on disk
    resumeOriginalName: { type: String, default: null },
    resumeText: { type: String, default: '' },
    matchScore: { type: Number, min: 0, max: 100, default: 0, index: true },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    analysis: { type: analysisSchema, default: () => ({}) },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
  },
  { timestamps: { createdAt: 'submittedAt', updatedAt: 'updatedAt' } }
);

candidateSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.resumeFile; // internal storage name – never sent to the browser
    ret.hasResumeFile = Boolean(doc.resumeFile);
    return ret;
  },
});

module.exports = mongoose.model('Candidate', candidateSchema);
module.exports.STATUSES = STATUSES;
module.exports.RECOMMENDATIONS = RECOMMENDATIONS;

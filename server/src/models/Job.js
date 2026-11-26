const mongoose = require('mongoose');

// Replaces MySQL `jobs`. Comma-separated TEXT columns become real arrays.
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    department: { type: String, trim: true, maxlength: 100, default: '' },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    minExperience: { type: Number, min: 0, max: 60, default: 0 },
    keywords: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, createdAt: -1 });

jobSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Job', jobSchema);

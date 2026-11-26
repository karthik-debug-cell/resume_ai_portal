const { z } = require('zod');
const { toList } = require('../utils/helpers');
const { STATUSES } = require('../models/Candidate');

// Accepts "a, b, c" or ["a","b","c"]
const listField = z.preprocess((v) => (v === undefined ? undefined : toList(v)), z.array(z.string().max(80)).max(50));

const jobBase = {
  title: z.string({ required_error: 'Job title is required' }).trim().min(2, 'Job title is required').max(200),
  department: z.string().trim().max(100).optional().default(''),
  description: z.string().trim().max(5000).optional().default(''),
  requiredSkills: z.preprocess((v) => (v === undefined ? undefined : toList(v)), z.array(z.string().max(80)).min(1, 'At least one required skill is needed').max(50), { required_error: 'At least one required skill is needed' }),
  preferredSkills: listField.optional().default([]),
  minExperience: z.coerce.number().int().min(0).max(60).optional().default(0),
  keywords: listField.optional().default([]),
  status: z.enum(['active', 'closed']).optional().default('active'),
};

const jobCreate = z.object(jobBase);
const jobUpdate = z.object(jobBase).partial();

const register = z.object({
  username: z.string().trim().toLowerCase().min(3, 'Username must be at least 3 characters').max(50).regex(/^[a-z0-9_.-]+$/, 'Username may only contain letters, numbers, . _ -'),
  email: z.string().trim().toLowerCase().email('Invalid email').max(200).optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  inviteCode: z.string().optional(),
});

const login = z.object({
  username: z.string().trim().toLowerCase().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const apply = z.object({
  name: z.string().trim().min(2, 'Full name is required').max(150),
  email: z.string().trim().toLowerCase().email('A valid email is required').max(200),
  phone: z.string().trim().max(30).optional().default(''),
  jobId: z.string().regex(/^[a-f\d]{24}$/i, 'A valid job must be selected'),
});

const candidateStatus = z.object({ status: z.enum(STATUSES, { errorMap: () => ({ message: `Status must be one of: ${STATUSES.join(', ')}` }) }) });

const candidateQuery = z.object({
  search: z.string().trim().max(100).optional().default(''),
  job: z.string().regex(/^[a-f\d]{24}$/i).optional().or(z.literal('')).transform((v) => v || undefined),
  status: z.enum(STATUSES).optional().or(z.literal('')).transform((v) => v || undefined),
  minScore: z.coerce.number().min(0).max(100).optional().default(0),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = { jobCreate, jobUpdate, register, login, apply, candidateStatus, candidateQuery };

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { jwtSecret, jwtExpiresIn, adminInviteCode } = require('../config/env');

const signToken = (admin) => jwt.sign({ sub: admin.id, username: admin.username }, jwtSecret, { algorithm: 'HS256', expiresIn: jwtExpiresIn });

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

// POST /api/auth/register
// Open only while no admin exists (first-run bootstrap). Afterwards an invite code is required.
exports.register = asyncHandler(async (req, res) => {
  const { username, email, password, inviteCode } = req.body;

  const adminCount = await Admin.estimatedDocumentCount();
  if (adminCount > 0) {
    if (!adminInviteCode || !inviteCode || !safeEqual(inviteCode, adminInviteCode)) {
      throw new AppError('A valid invite code is required to register another admin', 403);
    }
  }

  if (await Admin.exists({ username })) throw new AppError('Username already taken', 409);

  const admin = await Admin.create({ username, email: email || undefined, password });
  res.status(201).json({ success: true, data: { token: signToken(admin), admin } });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username }).select('+password');
  // Same message for unknown user and wrong password (no account enumeration)
  if (!admin || !(await admin.comparePassword(password))) throw new AppError('Invalid username or password', 401);
  res.json({ success: true, data: { token: signToken(admin), admin } });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { admin: req.admin } });
});

// GET /api/auth/setup-status – lets the UI know whether first-run registration is open
exports.setupStatus = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { hasAdmin: (await Admin.estimatedDocumentCount()) > 0 } });
});

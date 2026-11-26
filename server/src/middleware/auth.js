const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { jwtSecret } = require('../config/env');

exports.requireAdmin = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError('Authentication required', 401);

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    throw new AppError(err.name === 'TokenExpiredError' ? 'Session expired, please sign in again' : 'Invalid token', 401);
  }
  const admin = await Admin.findById(payload.sub);
  if (!admin) throw new AppError('Account no longer exists', 401);
  req.admin = admin;
  next();
});

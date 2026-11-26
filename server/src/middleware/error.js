const fs = require('fs');
const { ZodError } = require('zod');
const multer = require('multer');
const AppError = require('../utils/AppError');
const { isProd, maxFileSizeBytes } = require('../config/env');

exports.notFound = (req, _res, next) => next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, _next) => {
  // Remove an orphaned upload if the request failed after multer saved it
  if (req.file && req.file.path) fs.unlink(req.file.path, () => {});

  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors;

  if (err instanceof ZodError) {
    status = 400;
    errors = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    message = errors[0]?.message || 'Validation failed';
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? `File too large. Max ${Math.round(maxFileSizeBytes / 1024 / 1024)}MB.` : `Upload error: ${err.message}`;
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = errors[0]?.message || 'Validation failed';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyPattern || {})[0] || 'Value'} already exists`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (!err.isOperational) {
    console.error('[unhandled error]', err);
    status = 500;
    message = isProd ? 'Internal server error' : err.message;
  }

  res.status(status).json({ success: false, message, ...(errors && { errors }), ...(!isProd && status === 500 && { stack: err.stack }) });
};

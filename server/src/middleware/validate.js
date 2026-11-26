const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// validate(schema, 'body' | 'query') -> replaces req[source] with parsed (coerced/defaulted) data
exports.validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error); // handled in error middleware
  req[source] = result.data;
  next();
};

exports.validateObjectId = (param = 'id') => (req, _res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) return next(new AppError('Invalid ID format', 400));
  next();
};

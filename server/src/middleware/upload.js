const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');
const { maxFileSizeBytes } = require('../config/env');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'resumes');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// PDF, DOCX, TXT only. Both extension and MIME type must agree with the allow-list.
const ALLOWED = {
  '.pdf': ['application/pdf'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'],
  '.txt': ['text/plain'],
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  // Random name – never trust the client-supplied filename on disk
  filename: (_req, file, cb) => cb(null, `resume_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED[ext] || !ALLOWED[ext].includes(file.mimetype)) {
    return cb(new AppError('Invalid file type. Allowed: PDF, DOCX, TXT', 400));
  }
  cb(null, true);
};

exports.uploadResume = multer({ storage, fileFilter, limits: { fileSize: maxFileSizeBytes, files: 1 } }).single('resume');
exports.UPLOAD_DIR = UPLOAD_DIR;

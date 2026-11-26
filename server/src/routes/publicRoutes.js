const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/publicController');
const { uploadResume } = require('../middleware/upload');
const { validate, validateObjectId } = require('../middleware/validate');
const { apply } = require('../validators/schemas');

// Each application triggers a (paid) AI call – keep abuse in check
const applyLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many applications from this address. Please try again later.' } });

router.get('/jobs', ctrl.listActiveJobs);
router.get('/jobs/:id', validateObjectId(), ctrl.getActiveJob);
router.get('/stats', ctrl.publicStats);
router.post('/apply', applyLimiter, uploadResume, validate(apply), ctrl.apply);

module.exports = router;

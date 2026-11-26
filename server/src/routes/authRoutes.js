const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const { register, login } = require('../validators/schemas');

// Brute-force protection on credential endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many attempts. Please try again later.' } });

router.get('/setup-status', ctrl.setupStatus);
router.post('/register', authLimiter, validate(register), ctrl.register);
router.post('/login', authLimiter, validate(login), ctrl.login);
router.get('/me', requireAdmin, ctrl.me);

module.exports = router;

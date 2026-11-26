const router = require('express').Router();
const { getStats } = require('../controllers/dashboardController');
const { requireAdmin } = require('../middleware/auth');

router.get('/stats', requireAdmin, getStats);

module.exports = router;

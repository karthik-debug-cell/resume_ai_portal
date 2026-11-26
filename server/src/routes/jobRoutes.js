const router = require('express').Router();
const ctrl = require('../controllers/jobController');
const { requireAdmin } = require('../middleware/auth');
const { validate, validateObjectId } = require('../middleware/validate');
const { jobCreate, jobUpdate } = require('../validators/schemas');

router.use(requireAdmin);
router.get('/', ctrl.listJobs);
router.post('/', validate(jobCreate), ctrl.createJob);
router.get('/:id', validateObjectId(), ctrl.getJob);
router.put('/:id', validateObjectId(), validate(jobUpdate), ctrl.updateJob);
router.delete('/:id', validateObjectId(), ctrl.deleteJob);

module.exports = router;

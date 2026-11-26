const router = require('express').Router();
const ctrl = require('../controllers/candidateController');
const { requireAdmin } = require('../middleware/auth');
const { validate, validateObjectId } = require('../middleware/validate');
const { candidateStatus, candidateQuery } = require('../validators/schemas');

router.use(requireAdmin);
router.get('/', validate(candidateQuery, 'query'), ctrl.listCandidates);
router.get('/:id', validateObjectId(), ctrl.getCandidate);
router.patch('/:id/status', validateObjectId(), validate(candidateStatus), ctrl.updateStatus);
router.post('/:id/reanalyze', validateObjectId(), ctrl.reanalyze);
router.get('/:id/resume', validateObjectId(), ctrl.downloadResume);
router.delete('/:id', validateObjectId(), ctrl.deleteCandidate);

module.exports = router;

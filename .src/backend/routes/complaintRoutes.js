const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { ensureResident } = require('../middleware/roleGuard');
const complaintController = require('../controllers/complaintController');

router.post('/', verifyToken, ensureResident, complaintController.createComplaint);
router.get('/', verifyToken, ensureResident, complaintController.getUserComplaints);

module.exports = router;

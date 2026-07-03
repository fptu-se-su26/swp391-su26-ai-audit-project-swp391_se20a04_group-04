const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const residentController = require('../controllers/residentController');

router.get('/upcoming-schedules', verifyToken, residentController.getUpcomingSchedules);

module.exports = router;

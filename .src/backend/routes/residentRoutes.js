const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const residentController = require('../controllers/residentController');

router.get('/upcoming-schedules', verifyToken, residentController.getUpcomingSchedules);
router.patch('/profile', verifyToken, residentController.updateProfile);

module.exports = router;

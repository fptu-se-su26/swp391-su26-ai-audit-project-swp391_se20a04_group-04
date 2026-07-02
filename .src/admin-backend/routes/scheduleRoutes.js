const router = require('express').Router();
const scheduleController = require('../controllers/scheduleController');

router.get('/', scheduleController.getSchedules);

module.exports = router;

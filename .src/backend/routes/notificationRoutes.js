const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', verifyToken, notificationController.getNotifications);
router.post('/:id/read', verifyToken, notificationController.markAsRead);
router.post('/read-all', verifyToken, notificationController.markAllAsRead);
router.get('/settings', verifyToken, notificationController.getSettings);
router.post('/settings', verifyToken, notificationController.updateSettings);

module.exports = router;

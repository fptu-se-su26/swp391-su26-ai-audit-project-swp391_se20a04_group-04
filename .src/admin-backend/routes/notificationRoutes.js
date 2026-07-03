const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { ensureAdmin } = require('../middleware/roleGuard');
const notificationController = require('../controllers/notificationController');
const adminController = require('../controllers/adminController');

// Resident notification routes
router.get('/', verifyToken, notificationController.getNotifications);
router.post('/:id/read', verifyToken, notificationController.markAsRead);
router.post('/read-all', verifyToken, notificationController.markAllAsRead);
router.get('/settings', verifyToken, notificationController.getSettings);
router.post('/settings', verifyToken, notificationController.updateSettings);

// Admin notification management routes
router.get('/admin', verifyToken, ensureAdmin, adminController.getAdminNotifications);
router.post('/admin', verifyToken, ensureAdmin, adminController.createAdminNotification);
router.put('/admin/:id', verifyToken, ensureAdmin, adminController.updateAdminNotification);
router.delete('/admin/:id', verifyToken, ensureAdmin, adminController.deleteAdminNotification);

module.exports = router;

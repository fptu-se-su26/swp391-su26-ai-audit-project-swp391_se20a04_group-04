const notificationService = require('../services/notificationService');

/**
 * GET /api/notifications
 */
async function getNotifications(req, res) {
  try {
    const notifications = await notificationService.getNotifications(req.uid);
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('[API] Lỗi lấy danh sách thông báo:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/notifications/:id/read
 */
async function markAsRead(req, res) {
  const { id } = req.params;
  try {
    await notificationService.markAsRead(id, req.uid);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`[API] Lỗi đánh dấu đã đọc notification ${id}:`, error.message);
    const statusCode = error.message.includes('quyền') ? 403 : 500;
    return res.status(statusCode).json({ error: error.message });
  }
}

/**
 * POST /api/notifications/read-all
 */
async function markAllAsRead(req, res) {
  try {
    const result = await notificationService.markAllAsRead(req.uid);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[API] Lỗi đánh dấu đã đọc tất cả:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/notifications/settings
 */
async function getSettings(req, res) {
  try {
    const settings = await notificationService.getNotificationSettings(req.uid);
    return res.status(200).json(settings);
  } catch (error) {
    console.error('[API] Lỗi lấy cài đặt thông báo:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/notifications/settings
 */
async function updateSettings(req, res) {
  const { email, sms, push } = req.body;
  try {
    await notificationService.updateNotificationSettings(req.uid, { email, sms, push });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Lỗi cập nhật cài đặt thông báo:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead, getSettings, updateSettings };

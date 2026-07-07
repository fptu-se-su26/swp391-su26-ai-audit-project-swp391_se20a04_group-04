const authRoutes = require('./authRoutes');
const managerRoutes = require('./managerRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');
const healthRoutes = require('./healthRoutes');

/**
 * Mount tất cả route modules lên Express app.
 * Admin-backend chỉ định tuyến cho các chức năng quản lý.
 */
function mountRoutes(app) {
  // Public routes
  app.use('/api/auth', authRoutes);

  // Protected routes — Manager
  app.use('/api/manager', managerRoutes);

  // Protected routes — Notifications
  app.use('/api/notifications', notificationRoutes);

  // Protected routes — Admin only
  app.use('/api/admin', adminRoutes);

  // Health check
  app.use('/health', healthRoutes);
}

module.exports = mountRoutes;

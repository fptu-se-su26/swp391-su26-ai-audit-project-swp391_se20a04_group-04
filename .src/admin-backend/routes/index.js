const authRoutes = require('./authRoutes');
const addressRoutes = require('./addressRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const collectorRoutes = require('./collectorRoutes');
const residentRoutes = require('./residentRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const complaintRoutes = require('./complaintRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');
const healthRoutes = require('./healthRoutes');

/**
 * Mount tất cả route modules lên Express app.
 * Admin-backend bao gồm tất cả routes của backend + admin-specific routes.
 */
function mountRoutes(app) {
  // Public routes
  app.use('/api/auth', authRoutes);
  app.use('/api/address', addressRoutes);
  app.use('/api/schedules', scheduleRoutes);

  // Protected routes — Collector (multiple prefixes, mounted at /api)
  app.use('/api', collectorRoutes);

  // Protected routes — Resident
  app.use('/api/resident', residentRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/complaints', complaintRoutes);

  // Protected routes — Notifications (any authenticated user + admin management)
  app.use('/api/notifications', notificationRoutes);

  // Protected routes — Admin only
  app.use('/api/admin', adminRoutes);

  // Health check
  app.use('/health', healthRoutes);
}

module.exports = mountRoutes;

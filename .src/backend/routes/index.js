const authRoutes = require('./authRoutes');
const addressRoutes = require('./addressRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const managerRoutes = require('./managerRoutes');
const collectorRoutes = require('./collectorRoutes');
const residentRoutes = require('./residentRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const complaintRoutes = require('./complaintRoutes');
const notificationRoutes = require('./notificationRoutes');
const healthRoutes = require('./healthRoutes');

/**
 * Mount tất cả route modules lên Express app.
 */
function mountRoutes(app) {
  // Public routes
  app.use('/api/auth', authRoutes);
  app.use('/api/address', addressRoutes);
  app.use('/api/schedules', scheduleRoutes);

  // Protected routes — Manager
  app.use('/api/manager', managerRoutes);

  // Protected routes — Collector (multiple prefixes, mounted at /api)
  app.use('/api', collectorRoutes);

  // Protected routes — Resident
  app.use('/api/resident', residentRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/complaints', complaintRoutes);

  // Protected routes — Notifications (any authenticated user)
  app.use('/api/notifications', notificationRoutes);

  // Health check
  app.use('/health', healthRoutes);
}

module.exports = mountRoutes;

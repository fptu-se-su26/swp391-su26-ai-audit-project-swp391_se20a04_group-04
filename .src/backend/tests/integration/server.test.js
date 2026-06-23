const request = require('supertest');
const firebaseAdmin = require('../../firebaseAdmin');
const notificationService = require('../../services/notificationService');
const addressService = require('../../services/addressService');
const collectorService = require('../../services/collectorService');
const complaintService = require('../../services/complaintService');
const invoiceService = require('../../services/invoiceService');
const reportService = require('../../services/reportService');
const scheduleService = require('../../services/scheduleService');

// Mock Firebase Admin
jest.mock('../../firebaseAdmin', () => ({
  auth: {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
  db: {
    collection: jest.fn(),
    batch: jest.fn(() => ({ set: jest.fn(), commit: jest.fn() })),
    getAll: jest.fn(),
  }
}));

// Mock Services
jest.mock('../../services/notificationService');
jest.mock('../../services/addressService');
jest.mock('../../services/collectorService');
jest.mock('../../services/complaintService');
jest.mock('../../services/invoiceService');
jest.mock('../../services/reportService');
jest.mock('../../services/scheduleService');

// Mock Global Fetch for Auth
const originalFetch = global.fetch;
global.fetch = jest.fn((url, options) => {
  if (url.includes('signUp')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ localId: 'new_uid', idToken: 'fake_token' }) });
  }
  if (url.includes('signInWithPassword')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ localId: 'user_uid', idToken: 'fake_token' }) });
  }
  if (url.includes('sendOobCode')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
});

const app = require('../../server');

describe('Server Route Tests', () => {
  const setupDbMock = (role) => {
    const mockDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: role, fullName: 'Test User', area: 'Quận Sơn Trà, Đà Nẵng' }) }),
      set: jest.fn().mockResolvedValue(),
      update: jest.fn().mockResolvedValue(),
      delete: jest.fn().mockResolvedValue(),
    };
    const mockQuery = {
      get: jest.fn().mockResolvedValue({ empty: true, forEach: () => {}, docs: [] }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    };
    
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue(mockDoc),
      where: jest.fn().mockReturnValue(mockQuery),
      orderBy: jest.fn().mockReturnValue(mockQuery),
      add: jest.fn().mockResolvedValue({ id: 'new_id' }),
      get: jest.fn().mockResolvedValue({ empty: true, forEach: () => {}, docs: [] })
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    firebaseAdmin.auth.verifyIdToken.mockResolvedValue({ uid: 'test_uid' });
    setupDbMock('resident'); // default to citizen
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  // =============================================
  // Basic Routes (existing)
  // =============================================

  it('GET /health - Should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/address/provinces', async () => {
    addressService.getProvinces.mockResolvedValue([]);
    const res = await request(app).get('/api/address/provinces');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/address/wards', async () => {
    addressService.getWardsByProvince.mockResolvedValue([]);
    const res = await request(app).get('/api/address/wards').query({ provinceCode: '1' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/address/wards - Should return 400 without provinceCode', async () => {
    const res = await request(app).get('/api/address/wards');
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/schedules', async () => {
    scheduleService.getSchedules.mockResolvedValue([]);
    const res = await request(app).get('/api/schedules').query({ city: 'C', ward: 'W' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/schedules - Should return 400 without city or ward', async () => {
    const res = await request(app).get('/api/schedules');
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: 'A', email: 'a@a.com', password: 'abc' });
    expect(res.statusCode).toBe(201);
  });

  it('POST /api/auth/register - Should return 400 without required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@a.com' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/login', async () => {
    firebaseAdmin.auth.getUser.mockResolvedValue({ emailVerified: true });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: 'abc' });
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/auth/login - Should return 400 without email or password', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
  });

  // =============================================
  // Admin Routes
  // =============================================

  it('GET /api/admin/users - Should return users for admin', async () => {
    setupDbMock('admin');
    const res = await request(app).get('/api/admin/users').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/admin/users - Should return 403 for non-admin', async () => {
    setupDbMock('resident');
    const res = await request(app).get('/api/admin/users').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(403);
  });

  it('GET /api/admin/users - Should return 401 without token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/admin/users - Should create user for admin', async () => {
    setupDbMock('admin');
    firebaseAdmin.auth.createUser.mockResolvedValue({ uid: 'new_user_uid' });
    const res = await request(app).post('/api/admin/users')
      .set('Authorization', 'Bearer token')
      .send({ email: 'new@test.com', password: '123456', fullName: 'New User', role: 'resident' });
    expect(res.statusCode).toBe(201);
  });

  it('POST /api/admin/users - Should return 400 without required fields', async () => {
    setupDbMock('admin');
    const res = await request(app).post('/api/admin/users')
      .set('Authorization', 'Bearer token')
      .send({ email: 'test@test.com' });
    expect(res.statusCode).toBe(400);
  });

  it('PUT /api/admin/users/:uid - Should update user', async () => {
    setupDbMock('admin');
    firebaseAdmin.auth.updateUser.mockResolvedValue({});
    const res = await request(app).put('/api/admin/users/user1')
      .set('Authorization', 'Bearer token')
      .send({ fullName: 'Updated', phone: '123', role: 'manager' });
    expect(res.statusCode).toBe(200);
  });

  it('DELETE /api/admin/users/:uid - Should delete user', async () => {
    setupDbMock('admin');
    firebaseAdmin.auth.deleteUser.mockResolvedValue();
    const res = await request(app).delete('/api/admin/users/user1')
      .set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/admin/complaints - Should return complaints for admin', async () => {
    setupDbMock('admin');
    const res = await request(app).get('/api/admin/complaints').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/admin/transactions - Should return transactions for admin', async () => {
    setupDbMock('admin');
    firebaseAdmin.db.getAll = jest.fn().mockResolvedValue([]);
    const res = await request(app).get('/api/admin/transactions').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  // =============================================
  // Manager Routes
  // =============================================

  it('GET /api/manager/schedules', async () => {
    setupDbMock('manager');
    const res = await request(app).get('/api/manager/schedules').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/manager/schedules - Should create schedule', async () => {
    setupDbMock('manager');
    const res = await request(app).post('/api/manager/schedules')
      .set('Authorization', 'Bearer token')
      .send({
        routeName: 'Route 1', serviceType: 'organic', date: '2026-07-01',
        time: '08:00', city: 'Đà Nẵng', ward: 'Sơn Trà'
      });
    expect(res.statusCode).toBe(201);
  });

  it('POST /api/manager/schedules - Should return 400 without required fields', async () => {
    setupDbMock('manager');
    const res = await request(app).post('/api/manager/schedules')
      .set('Authorization', 'Bearer token')
      .send({ routeName: 'Route 1' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/manager/schedules - Should return 400 for invalid routePoints', async () => {
    setupDbMock('manager');
    const res = await request(app).post('/api/manager/schedules')
      .set('Authorization', 'Bearer token')
      .send({
        routeName: 'Route 1', serviceType: 'organic', date: '2026-07-01',
        time: '08:00', city: 'Đà Nẵng', ward: 'Sơn Trà', routePoints: 'invalid'
      });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/manager/assign-route - Should assign route', async () => {
    const mockScheduleDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ collector_confirmed: false }) }),
      update: jest.fn().mockResolvedValue()
    };
    const mockUserDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'manager', fullName: 'Manager' }) }),
    };
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return { doc: jest.fn().mockReturnValue(mockUserDoc) };
      }
      return { doc: jest.fn().mockReturnValue(mockScheduleDoc) };
    });

    const res = await request(app).post('/api/manager/assign-route')
      .set('Authorization', 'Bearer token')
      .send({ scheduleId: 's1', assignedTruck: 'T1', assignedDriver: 'D1' });
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/manager/assign-route - Should return 400 without required fields', async () => {
    setupDbMock('manager');
    const res = await request(app).post('/api/manager/assign-route')
      .set('Authorization', 'Bearer token')
      .send({ scheduleId: 's1' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/manager/confirm-route - Should confirm route', async () => {
    const mockScheduleDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
      update: jest.fn().mockResolvedValue()
    };
    const mockUserDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'manager', fullName: 'Manager' }) }),
    };
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return { doc: jest.fn().mockReturnValue(mockUserDoc) };
      }
      return { doc: jest.fn().mockReturnValue(mockScheduleDoc) };
    });

    const res = await request(app).post('/api/manager/confirm-route')
      .set('Authorization', 'Bearer token')
      .send({ scheduleId: 's1' });
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/manager/confirm-route - Should return 400 without scheduleId', async () => {
    setupDbMock('manager');
    const res = await request(app).post('/api/manager/confirm-route')
      .set('Authorization', 'Bearer token')
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/manager/collectors - Should return collectors list', async () => {
    setupDbMock('manager');
    const res = await request(app).get('/api/manager/collectors').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/manager/complaints - Should return complaints for manager', async () => {
    setupDbMock('manager');
    complaintService.getAllComplaints.mockResolvedValue([{ id: 'c1', title: 'Test' }]);
    const res = await request(app).get('/api/manager/complaints').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('PATCH /api/manager/complaints/:id/status - Should update complaint status', async () => {
    setupDbMock('manager');
    complaintService.updateComplaintStatus.mockResolvedValue({ id: 'c1', status: 'resolved' });
    const res = await request(app).patch('/api/manager/complaints/c1/status')
      .set('Authorization', 'Bearer token')
      .send({ status: 'resolved', comment: 'Done' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/manager/feedback-reports - Should return reports', async () => {
    setupDbMock('manager');
    reportService.listReports.mockResolvedValue([]);
    const res = await request(app).get('/api/manager/feedback-reports').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/manager/feedback-reports/:id/comments - Should return comments', async () => {
    setupDbMock('manager');
    reportService.getReportComments.mockResolvedValue([]);
    const res = await request(app).get('/api/manager/feedback-reports/r1/comments').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('PATCH /api/manager/feedback-reports/:id/approve - Should approve report', async () => {
    setupDbMock('manager');
    reportService.approveReport.mockResolvedValue({ success: true });
    const res = await request(app).patch('/api/manager/feedback-reports/r1/approve')
      .set('Authorization', 'Bearer token')
      .send({});
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/manager/reports - Should return report data', async () => {
    setupDbMock('manager');
    const res = await request(app).get('/api/manager/reports').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('PUT /api/manager/schedules/:id - Should update schedule', async () => {
    const mockScheduleDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ collector_confirmed: false }) }),
      update: jest.fn().mockResolvedValue()
    };
    const mockUserDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'manager', fullName: 'Manager' }) }),
    };
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return { doc: jest.fn().mockReturnValue(mockUserDoc) };
      }
      return { doc: jest.fn().mockReturnValue(mockScheduleDoc) };
    });

    const res = await request(app).put('/api/manager/schedules/s1')
      .set('Authorization', 'Bearer token')
      .send({ routePoints: [[10.1, 108.2]] });
    expect(res.statusCode).toBe(200);
  });

  it('DELETE /api/manager/schedules/:id - Should delete schedule', async () => {
    const mockScheduleDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ collector_confirmed: false }) }),
      delete: jest.fn().mockResolvedValue()
    };
    const mockUserDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'manager', fullName: 'Manager' }) }),
    };
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return { doc: jest.fn().mockReturnValue(mockUserDoc) };
      }
      return { doc: jest.fn().mockReturnValue(mockScheduleDoc) };
    });

    const res = await request(app).delete('/api/manager/schedules/s1')
      .set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/manager/invoices - Should create invoice as manager', async () => {
    setupDbMock('manager');
    invoiceService.createOrUpdateInvoice.mockResolvedValue({ invoiceId: 'inv1' });
    const res = await request(app).post('/api/manager/invoices')
      .set('Authorization', 'Bearer token')
      .send({
        invoiceId: 'inv1', userId: 'u1', amount: 100000,
        currency: 'VND', dueDate: '2026-07-01', feeType: 'garbage'
      });
    expect(res.statusCode).toBe(201);
  });

  it('POST /api/manager/invoices - Should return 400 without required fields', async () => {
    setupDbMock('manager');
    const res = await request(app).post('/api/manager/invoices')
      .set('Authorization', 'Bearer token')
      .send({ invoiceId: 'inv1' });
    expect(res.statusCode).toBe(400);
  });

  // =============================================
  // Collector Routes
  // =============================================

  it('GET /api/collector/schedules', async () => {
    setupDbMock('collector');
    collectorService.getDailySchedules.mockResolvedValue({ items: [] });
    const res = await request(app).get('/api/collector/schedules').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/dashboard/collector - Should return dashboard data', async () => {
    setupDbMock('collector');
    collectorService.getDashboardSummary.mockResolvedValue({ todayAssignments: 0 });
    const res = await request(app).get('/api/dashboard/collector').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/route-assignments/my - Should return assignments', async () => {
    setupDbMock('collector');
    collectorService.getAssignmentsInRange.mockResolvedValue([]);
    const res = await request(app).get('/api/route-assignments/my').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('PATCH /api/collector/schedules/:sourceType/:id/status - Should update status', async () => {
    setupDbMock('collector');
    collectorService.updateItemStatus.mockResolvedValue({ success: true });
    const res = await request(app).patch('/api/collector/schedules/assignment/a1/status')
      .set('Authorization', 'Bearer token')
      .send({ action: 'start' });
    expect(res.statusCode).toBe(200);
  });

  it('PATCH /api/route-assignments/:id/status - Should update assignment status', async () => {
    setupDbMock('collector');
    collectorService.updateItemStatus.mockResolvedValue({ success: true });
    const res = await request(app).patch('/api/route-assignments/a1/status')
      .set('Authorization', 'Bearer token')
      .send({ status: 'in_progress' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/collector/reports - Should return reports', async () => {
    setupDbMock('collector');
    collectorService.getAssignedReports.mockResolvedValue([]);
    const res = await request(app).get('/api/collector/reports').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/reports/:id/comments - Should return comments', async () => {
    setupDbMock('collector');
    collectorService.getReportComments.mockResolvedValue([]);
    const res = await request(app).get('/api/reports/r1/comments').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('PATCH /api/reports/:id/status - Should update report status', async () => {
    setupDbMock('collector');
    collectorService.updateReportStatus.mockResolvedValue({ success: true });
    const res = await request(app).patch('/api/reports/r1/status')
      .set('Authorization', 'Bearer token')
      .send({ status: 'in_progress' });
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/collector/confirm-route - Should confirm route for collector', async () => {
    const mockScheduleDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ assigned_collector: 'test_uid' }) }),
      update: jest.fn().mockResolvedValue()
    };
    const mockUserDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'collector', fullName: 'Collector' }) }),
    };
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return { doc: jest.fn().mockReturnValue(mockUserDoc) };
      }
      return { doc: jest.fn().mockReturnValue(mockScheduleDoc) };
    });

    const res = await request(app).post('/api/collector/confirm-route')
      .set('Authorization', 'Bearer token')
      .send({ scheduleId: 's1' });
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/collector/confirm-route - Should return 400 without scheduleId', async () => {
    setupDbMock('collector');
    const res = await request(app).post('/api/collector/confirm-route')
      .set('Authorization', 'Bearer token')
      .send({});
    expect(res.statusCode).toBe(400);
  });

  // =============================================
  // Resident Complaint Routes
  // =============================================

  it('POST /api/complaints - Should create complaint', async () => {
    setupDbMock('resident');
    complaintService.createComplaint.mockResolvedValue({ id: 'c1', title: 'Test' });
    const res = await request(app).post('/api/complaints')
      .set('Authorization', 'Bearer token')
      .send({ title: 'Rác', description: 'Nhiều rác', type: 'Env' });
    expect(res.statusCode).toBe(201);
  });

  it('GET /api/complaints - Should return user complaints', async () => {
    setupDbMock('resident');
    complaintService.getUserComplaints.mockResolvedValue([]);
    const res = await request(app).get('/api/complaints').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  // =============================================
  // Resident Invoice Routes
  // =============================================

  it('POST /api/invoices - Should create invoice', async () => {
    setupDbMock('resident');
    invoiceService.createOrUpdateInvoice.mockResolvedValue({ invoiceId: 'inv1' });
    const res = await request(app).post('/api/invoices')
      .set('Authorization', 'Bearer token')
      .send({
        invoiceId: 'inv1', amount: 100000, currency: 'VND',
        dueDate: '2026-07-01', feeType: 'garbage'
      });
    expect(res.statusCode).toBe(201);
  });

  it('POST /api/invoices - Should return 400 without required fields', async () => {
    setupDbMock('resident');
    const res = await request(app).post('/api/invoices')
      .set('Authorization', 'Bearer token')
      .send({ invoiceId: 'inv1' });
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/invoices/current - Should return current invoice', async () => {
    setupDbMock('resident');
    invoiceService.getLatestInvoiceForUser.mockResolvedValue({ invoiceId: 'inv1', status: 'paid' });
    const res = await request(app).get('/api/invoices/current').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/invoices/current - Should return 404 when no invoice', async () => {
    setupDbMock('resident');
    invoiceService.getLatestInvoiceForUser.mockResolvedValue(null);
    const res = await request(app).get('/api/invoices/current').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/invoices/:id - Should return invoice by id', async () => {
    setupDbMock('resident');
    invoiceService.getInvoiceById.mockResolvedValue({ invoiceId: 'inv1', userId: 'test_uid' });
    const res = await request(app).get('/api/invoices/inv1').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/invoices/:id - Should return 404 for wrong user', async () => {
    setupDbMock('resident');
    invoiceService.getInvoiceById.mockResolvedValue({ invoiceId: 'inv1', userId: 'other_user' });
    const res = await request(app).get('/api/invoices/inv1').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(404);
  });

  it('POST /api/invoices/:id/verify-payment - Should verify payment', async () => {
    setupDbMock('resident');
    invoiceService.getInvoiceById.mockResolvedValue({ invoiceId: 'inv1', userId: 'test_uid', status: 'paid' });
    const res = await request(app).post('/api/invoices/inv1/verify-payment')
      .set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
    expect(res.body.paid).toBe(true);
  });

  it('POST /api/invoices/:id/verify-payment - Should return 404 for wrong user', async () => {
    setupDbMock('resident');
    invoiceService.getInvoiceById.mockResolvedValue({ invoiceId: 'inv1', userId: 'other_user', status: 'unpaid' });
    const res = await request(app).post('/api/invoices/inv1/verify-payment')
      .set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(404);
  });

  // =============================================
  // Notification Routes
  // =============================================

  it('GET /api/notifications', async () => {
    notificationService.getNotifications.mockResolvedValue([]);
    const res = await request(app).get('/api/notifications').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/notifications/:id/read - Should mark as read', async () => {
    notificationService.markAsRead.mockResolvedValue();
    const res = await request(app).post('/api/notifications/n1/read').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/notifications/read-all - Should mark all as read', async () => {
    notificationService.markAllAsRead.mockResolvedValue({ updated: 5 });
    const res = await request(app).post('/api/notifications/read-all').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/notifications/settings - Should return settings', async () => {
    notificationService.getNotificationSettings.mockResolvedValue({ email: true, sms: false, push: true });
    const res = await request(app).get('/api/notifications/settings').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/notifications/settings - Should update settings', async () => {
    notificationService.updateNotificationSettings.mockResolvedValue();
    const res = await request(app).post('/api/notifications/settings')
      .set('Authorization', 'Bearer token')
      .send({ email: true, sms: false, push: true });
    expect(res.statusCode).toBe(200);
  });

  // =============================================
  // Admin Notification Routes
  // =============================================

  it('GET /api/notifications/admin - Should return all notifications', async () => {
    setupDbMock('admin');
    notificationService.getAdminNotifications.mockResolvedValue([]);
    const res = await request(app).get('/api/notifications/admin').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/notifications/admin - Should create notification', async () => {
    setupDbMock('admin');
    notificationService.createAdminNotification.mockResolvedValue({ id: 'n1' });
    const res = await request(app).post('/api/notifications/admin')
      .set('Authorization', 'Bearer token')
      .send({ title: 'Test', message: 'Hello', type: 'system', targetRole: 'all' });
    expect(res.statusCode).toBe(201);
  });

  it('PUT /api/notifications/admin/:id - Should update notification', async () => {
    setupDbMock('admin');
    notificationService.updateAdminNotification.mockResolvedValue({ id: 'n1' });
    const res = await request(app).put('/api/notifications/admin/n1')
      .set('Authorization', 'Bearer token')
      .send({ title: 'Updated', message: 'Updated content' });
    expect(res.statusCode).toBe(200);
  });

  it('DELETE /api/notifications/admin/:id - Should delete notification', async () => {
    setupDbMock('admin');
    notificationService.deleteAdminNotification.mockResolvedValue({ id: 'n1', deleted: true });
    const res = await request(app).delete('/api/notifications/admin/n1')
      .set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  // =============================================
  // Resident Upcoming Schedules
  // =============================================

  it('GET /api/resident/upcoming-schedules - Should return schedules', async () => {
    setupDbMock('resident');
    const res = await request(app).get('/api/resident/upcoming-schedules')
      .set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  // =============================================
  // Auth Middleware Tests
  // =============================================

  it('Should return 401 for invalid token', async () => {
    firebaseAdmin.auth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));
    const res = await request(app).get('/api/notifications').set('Authorization', 'Bearer bad_token');
    expect(res.statusCode).toBe(401);
  });

  it('Should return 401 without Authorization header', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.statusCode).toBe(401);
  });

  // =============================================
  // Google Login
  // =============================================

  it('POST /api/auth/google-login - Should return 400 without idToken', async () => {
    const res = await request(app).post('/api/auth/google-login').send({});
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/google-login - Should login with Google for existing user', async () => {
    firebaseAdmin.auth.verifyIdToken.mockResolvedValue({ uid: 'google_uid', email: 'g@g.com', email_verified: true });
    firebaseAdmin.auth.getUser.mockResolvedValue({ displayName: 'Google User' });

    const mockDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'resident', fullName: 'Google User', emailVerified: true }) }),
      set: jest.fn().mockResolvedValue(),
      update: jest.fn().mockResolvedValue(),
    };
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue(mockDoc),
    });

    const res = await request(app).post('/api/auth/google-login').send({ idToken: 'google_token' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBe('google_token');
  });

  it('POST /api/auth/google-login - Should create new user on first Google login', async () => {
    firebaseAdmin.auth.verifyIdToken.mockResolvedValue({ uid: 'new_google_uid', email: 'new@g.com', email_verified: true });
    firebaseAdmin.auth.getUser.mockResolvedValue({ displayName: 'New Google User' });

    const mockDoc = {
      get: jest.fn().mockResolvedValue({ exists: false }),
      set: jest.fn().mockResolvedValue(),
    };
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue(mockDoc),
    });

    const res = await request(app).post('/api/auth/google-login').send({ idToken: 'google_token' });
    expect(res.statusCode).toBe(200);
    expect(mockDoc.set).toHaveBeenCalled();
  });
});

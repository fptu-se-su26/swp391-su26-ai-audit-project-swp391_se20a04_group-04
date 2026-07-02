'use strict';

const request = require('supertest');

// ─── Firebase mock ────────────────────────────────────────────────────────────
// Intercepts require('../config/firebase') in all controllers and services.
jest.mock('../../config/firebase', () => {
  const docRef = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  };

  const collRef = {
    doc: jest.fn(() => docRef),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
    }),
    get: jest.fn(),
    add: jest.fn().mockResolvedValue({ id: 'new-schedule-id' }),
  };

  const db = { collection: jest.fn(() => collRef) };

  const auth = {
    verifyIdToken: jest.fn(),
    getUser: jest.fn().mockResolvedValue({
      uid: 'test-uid',
      displayName: 'Test User',
      phoneNumber: '',
      emailVerified: true,
    }),
    createUser: jest.fn().mockResolvedValue({ uid: 'new-user-uid' }),
    updateUser: jest.fn().mockResolvedValue({}),
    deleteUser: jest.fn().mockResolvedValue({}),
  };

  return { db, auth, admin: {}, _docRef: docRef, _collRef: collRef };
});

// ─── External service mocks ───────────────────────────────────────────────────
jest.mock('../../services/addressService', () => ({
  getProvinces: jest.fn().mockResolvedValue([{ code: '01', name: 'Hà Nội' }]),
  getWardsByProvince: jest.fn().mockResolvedValue([{ code: '001', name: 'Phường 1' }]),
}));

jest.mock('../../helpers/payosHelper', () => ({
  createPayOSPaymentSession: jest.fn().mockResolvedValue({
    paymentUrl: 'https://pay.test/link',
    qrCode: null,
  }),
  verifyPayOSPayment: jest.fn().mockResolvedValue({ success: true, message: 'Thanh toán thành công.' }),
}));

// ─── App + mock references ────────────────────────────────────────────────────
const app = require('../../server');
const { auth, _docRef: docRef, _collRef: collRef } = require('../../config/firebase');

// ─── Test helpers ─────────────────────────────────────────────────────────────
const bearer = (token = 'valid-token') => ({ Authorization: `Bearer ${token}` });

const makeUserDoc = (role = 'resident') => ({
  exists: true,
  id: 'test-uid',
  data: () => ({
    uid: 'test-uid',
    email: 'test@test.com',
    fullName: 'Test User',
    role,
    area: 'Quận Sơn Trà, Đà Nẵng',
    address: '123 Test St',
    phone: '0123456789',
    emailVerified: true,
  }),
});

const makeQuerySnap = (items = []) => ({
  empty: items.length === 0,
  docs: items.map((d, i) => ({ id: `doc-id-${i}`, data: () => d })),
  forEach: jest.fn((cb) =>
    items.forEach((d, i) => cb({ id: `doc-id-${i}`, data: () => d }))
  ),
});

// ─── Default setup ────────────────────────────────────────────────────────────
// Use resetAllMocks so unconsumed mockResolvedValueOnce values from prior tests
// don't leak into the next test (clearAllMocks does NOT flush the Once queue).
function setupDefaultMocks(userRole = 'resident') {
  jest.resetAllMocks();

  // Auth
  auth.verifyIdToken.mockResolvedValue({ uid: 'test-uid', email: 'test@test.com', email_verified: true });
  auth.getUser.mockResolvedValue({ uid: 'test-uid', displayName: 'Test User', phoneNumber: '', emailVerified: true });
  auth.createUser.mockResolvedValue({ uid: 'new-user-uid' });
  auth.updateUser.mockResolvedValue({});
  auth.deleteUser.mockResolvedValue({});

  // Firestore – restore chainable helpers and defaults
  collRef.doc.mockReturnValue(docRef);
  collRef.where.mockReturnThis();
  collRef.orderBy.mockReturnThis();
  collRef.limit.mockReturnThis();
  collRef.offset.mockReturnThis();
  collRef.count.mockReturnValue({ get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }) });
  collRef.get.mockResolvedValue(makeQuerySnap([]));
  collRef.add.mockResolvedValue({ id: 'new-id' });

  docRef.get.mockResolvedValue(makeUserDoc(userRole));
  docRef.set.mockResolvedValue({});
  docRef.update.mockResolvedValue({});
  docRef.delete.mockResolvedValue({});

  // Fetch mock for Firebase Auth REST API (login / register)
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ localId: 'test-uid', idToken: 'fake-id-token', email: 'test@test.com' }),
  });
}

beforeEach(() => setupDefaultMocks('resident'));

// =============================================================================
// TC_INT_001 — Health Check
// =============================================================================
describe('TC_INT_001 — Health Check', () => {
  test('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// =============================================================================
// TC_INT_002-004 — Address Routes
// =============================================================================
describe('TC_INT_002-004 — Address Routes', () => {
  test('TC_INT_002: GET /api/address/provinces → 200', async () => {
    const res = await request(app).get('/api/address/provinces');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('TC_INT_003: GET /api/address/wards?provinceCode=01 → 200', async () => {
    const res = await request(app).get('/api/address/wards?provinceCode=01');
    expect(res.status).toBe(200);
  });

  test('TC_INT_004: GET /api/address/wards (no provinceCode) → 400', async () => {
    const res = await request(app).get('/api/address/wards');
    expect(res.status).toBe(400);
  });
});

// =============================================================================
// TC_INT_005-006 — Schedule Routes (public)
// =============================================================================
describe('TC_INT_005-006 — Public Schedule Routes', () => {
  test('TC_INT_005: GET /api/schedules?city=Đà+Nẵng&ward=Mỹ+An → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app).get('/api/schedules?city=Đà Nẵng&ward=Mỹ An');
    expect(res.status).toBe(200);
  });

  test('TC_INT_006: GET /api/schedules (no city or ward) → 400', async () => {
    const res = await request(app).get('/api/schedules');
    expect(res.status).toBe(400);
  });
});

// =============================================================================
// TC_INT_007-010 — Auth Routes
// =============================================================================
describe('TC_INT_007-010 — Auth Routes', () => {
  test('TC_INT_007: POST /api/auth/register (valid data) → 201', async () => {
    docRef.set.mockResolvedValue({});
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'pass123', fullName: 'New User' });
    expect(res.status).toBe(201);
  });

  test('TC_INT_008: POST /api/auth/register (missing fields) → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
  });

  test('TC_INT_009: POST /api/auth/login (valid data) → 200', async () => {
    // Mock Firestore user doc for login
    docRef.get.mockResolvedValue(makeUserDoc('resident'));
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'pass123' });
    expect(res.status).toBe(200);
  });

  test('TC_INT_010: POST /api/auth/login (missing email or password) → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
  });
});

// =============================================================================
// TC_INT_069-073 — Auth Middleware + Google Login
// =============================================================================
describe('TC_INT_069-073 — Auth Middleware + Google Login', () => {
  test('TC_INT_069: Protected route → 401 for invalid token', async () => {
    auth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));
    const res = await request(app)
      .get('/api/notifications')
      .set(bearer('bad-token'));
    expect(res.status).toBe(401);
  });

  test('TC_INT_070: Protected route → 401 without Authorization header', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  test('TC_INT_071: POST /api/auth/google-login (no idToken) → 400', async () => {
    const res = await request(app).post('/api/auth/google-login').send({});
    expect(res.status).toBe(400);
  });

  test('TC_INT_072: POST /api/auth/google-login (existing user) → 200', async () => {
    auth.verifyIdToken.mockResolvedValue({
      uid: 'google-uid',
      email: 'google@test.com',
      email_verified: true,
    });
    auth.getUser.mockResolvedValue({
      uid: 'google-uid',
      displayName: 'Google User',
      phoneNumber: '',
      emailVerified: true,
    });
    docRef.get.mockResolvedValue(makeUserDoc('resident'));
    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ idToken: 'google-id-token' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('TC_INT_073: POST /api/auth/google-login (new user) → 200', async () => {
    auth.verifyIdToken.mockResolvedValue({
      uid: 'new-google-uid',
      email: 'newgoogle@test.com',
      email_verified: true,
    });
    auth.getUser.mockResolvedValue({
      uid: 'new-google-uid',
      displayName: 'New Google User',
      phoneNumber: '',
      emailVerified: true,
    });
    // Non-existing user doc
    docRef.get.mockResolvedValue({ exists: false, id: null, data: () => ({}) });
    docRef.set.mockResolvedValue({});
    const res = await request(app)
      .post('/api/auth/google-login')
      .send({ idToken: 'new-google-token' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

// =============================================================================
// TC_INT_020-038 — Manager Routes
// =============================================================================
describe('TC_INT_020-038 — Manager Routes', () => {
  beforeEach(() => setupDefaultMocks('manager'));

  test('TC_INT_020: GET /api/manager/schedules → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/manager/schedules')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_021: POST /api/manager/schedules (valid data) → 201', async () => {
    collRef.add.mockResolvedValue({ id: 'sched-001' });
    const res = await request(app)
      .post('/api/manager/schedules')
      .set(bearer())
      .send({
        routeName: 'Route A',
        serviceType: 'Rác thải thông thường',
        date: '2026-08-01',
        time: '08:00',
        city: 'Đà Nẵng',
        ward: 'Mỹ An',
      });
    expect(res.status).toBe(201);
  });

  test('TC_INT_022: POST /api/manager/schedules (missing fields) → 400', async () => {
    const res = await request(app)
      .post('/api/manager/schedules')
      .set(bearer())
      .send({ routeName: 'Route A' });
    expect(res.status).toBe(400);
  });

  test('TC_INT_023: POST /api/manager/schedules (invalid routePoints) → 400', async () => {
    const res = await request(app)
      .post('/api/manager/schedules')
      .set(bearer())
      .send({
        routeName: 'Route A',
        serviceType: 'Rác thải',
        date: '2026-08-01',
        time: '08:00',
        city: 'Đà Nẵng',
        ward: 'Mỹ An',
        routePoints: 'not-an-array',
      });
    expect(res.status).toBe(400);
  });

  test('TC_INT_024: POST /api/manager/assign-route (valid data) → 200', async () => {
    // docRef.get for schedule lookup (not user lookup)
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('manager'))   // roleGuard user check
      .mockResolvedValueOnce({                          // schedule doc check
        exists: true,
        data: () => ({ collector_confirmed: false }),
      });
    const res = await request(app)
      .post('/api/manager/assign-route')
      .set(bearer())
      .send({ scheduleId: 'sched-001', assignedTruck: 'Truck-1', assignedDriver: 'Driver-1' });
    expect([200, 201]).toContain(res.status);
  });

  test('TC_INT_025: POST /api/manager/assign-route (missing fields) → 400', async () => {
    const res = await request(app)
      .post('/api/manager/assign-route')
      .set(bearer())
      .send({ scheduleId: 'sched-001' });
    expect(res.status).toBe(400);
  });

  test('TC_INT_026: POST /api/manager/confirm-route (valid scheduleId) → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('manager'))
      .mockResolvedValueOnce({ exists: true, data: () => ({ collector_confirmed: false }) });
    const res = await request(app)
      .post('/api/manager/confirm-route')
      .set(bearer())
      .send({ scheduleId: 'sched-001' });
    expect([200, 201]).toContain(res.status);
  });

  test('TC_INT_027: POST /api/manager/confirm-route (no scheduleId) → 400', async () => {
    const res = await request(app)
      .post('/api/manager/confirm-route')
      .set(bearer())
      .send({});
    expect(res.status).toBe(400);
  });

  test('TC_INT_028: GET /api/manager/collectors → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/manager/collectors')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_029: GET /api/manager/complaints → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/manager/complaints')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_030: PATCH /api/manager/complaints/:id/status → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('manager'))
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ status: 'open', title: 'Test Complaint' }),
      });
    const res = await request(app)
      .patch('/api/manager/complaints/complaint-001/status')
      .set(bearer())
      .send({ status: 'resolved', comment: 'Fixed.' });
    expect([200, 201]).toContain(res.status);
  });

  test('TC_INT_031: GET /api/manager/feedback-reports → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/manager/feedback-reports')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_032: GET /api/manager/feedback-reports/:id/comments → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('manager'))
      .mockResolvedValueOnce({ exists: true, data: () => ({ title: 'Report' }) });
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/manager/feedback-reports/report-001/comments')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_033: PATCH /api/manager/feedback-reports/:id/approve → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('manager'))
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ status: 'resolved_pending_approval', citizenId: 'cit-1', title: 'Test Report' }),
      });
    const res = await request(app)
      .patch('/api/manager/feedback-reports/report-001/approve')
      .set(bearer())
      .send({ message: 'Approved.' });
    expect([200, 201]).toContain(res.status);
  });

  test('TC_INT_034: GET /api/manager/reports → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/manager/reports')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_035: PUT /api/manager/schedules/:id → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('manager'))
      .mockResolvedValueOnce({ exists: true, data: () => ({ collector_confirmed: false }) });
    const res = await request(app)
      .put('/api/manager/schedules/sched-001')
      .set(bearer())
      .send({ routePoints: [] });
    expect([200, 201]).toContain(res.status);
  });

  test('TC_INT_036: DELETE /api/manager/schedules/:id → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('manager'))
      .mockResolvedValueOnce({ exists: true, data: () => ({ collector_confirmed: false }) });
    const res = await request(app)
      .delete('/api/manager/schedules/sched-001')
      .set(bearer());
    expect([200, 201]).toContain(res.status);
  });

  test('TC_INT_037: POST /api/manager/invoices (valid data) → 201', async () => {
    docRef.get.mockResolvedValue(makeUserDoc('manager'));
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    docRef.set.mockResolvedValue({});
    const res = await request(app)
      .post('/api/manager/invoices')
      .set(bearer())
      .send({
        invoiceId: 'inv-001',
        userId: 'user-001',
        amount: 100000,
        currency: 'VND',
        dueDate: '2026-08-31',
        feeType: 'monthly',
      });
    expect(res.status).toBe(201);
  });

  test('TC_INT_038: POST /api/manager/invoices (missing fields) → 400', async () => {
    const res = await request(app)
      .post('/api/manager/invoices')
      .set(bearer())
      .send({ invoiceId: 'inv-001' });
    expect(res.status).toBe(400);
  });
});

// =============================================================================
// TC_INT_039-048 — Collector Routes
// =============================================================================
describe('TC_INT_039-048 — Collector Routes', () => {
  beforeEach(() => setupDefaultMocks('collector'));

  test('TC_INT_039: GET /api/collector/schedules → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/collector/schedules')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_040: GET /api/dashboard/collector → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/dashboard/collector')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_041: GET /api/route-assignments/my → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/route-assignments/my')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_042: PATCH /api/collector/schedules/:source/:id/status → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('collector'))
      .mockResolvedValueOnce({ exists: true, data: () => ({ status: 'Assigned' }) });
    const res = await request(app)
      .patch('/api/collector/schedules/main/sched-001/status')
      .set(bearer())
      .send({ status: 'In Progress' });
    expect([200, 201]).toContain(res.status);
  });

  test('TC_INT_043: PATCH /api/route-assignments/:id/status → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('collector'))
      .mockResolvedValueOnce({ exists: true, data: () => ({ assignedCollectorId: 'test-uid', status: 'pending' }) });
    const res = await request(app)
      .patch('/api/route-assignments/assign-001/status')
      .set(bearer())
      .send({ status: 'accepted' });
    expect([200, 201]).toContain(res.status);
  });

  test('TC_INT_044: GET /api/collector/reports → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/collector/reports')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_045: GET /api/reports/:id/comments → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('collector'))
      .mockResolvedValueOnce({ exists: true, data: () => ({ title: 'Report' }) });
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/reports/report-001/comments')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_046: PATCH /api/reports/:id/status → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('collector'))
      .mockResolvedValueOnce({ exists: true, data: () => ({ submittedBy: 'test-uid', status: 'pending' }) });
    const res = await request(app)
      .patch('/api/reports/report-001/status')
      .set(bearer())
      .send({ status: 'resolved' });
    expect([200, 201]).toContain(res.status);
  });

  test('TC_INT_047: POST /api/collector/confirm-route (valid scheduleId) → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('collector'))
      .mockResolvedValueOnce({ exists: true, data: () => ({ collector_confirmed: false }) });
    const res = await request(app)
      .post('/api/collector/confirm-route')
      .set(bearer())
      .send({ scheduleId: 'sched-001' });
    expect([200, 201]).toContain(res.status);
  });

  test('TC_INT_048: POST /api/collector/confirm-route (no scheduleId) → 400', async () => {
    const res = await request(app)
      .post('/api/collector/confirm-route')
      .set(bearer())
      .send({});
    expect(res.status).toBe(400);
  });
});

// =============================================================================
// TC_INT_049-058 — Resident Complaint + Invoice Routes
// =============================================================================
describe('TC_INT_049-050 — Resident Complaint Routes', () => {
  beforeEach(() => setupDefaultMocks('resident'));

  test('TC_INT_049: POST /api/complaints (valid data) → 201', async () => {
    collRef.add.mockResolvedValue({ id: 'complaint-001' });
    const res = await request(app)
      .post('/api/complaints')
      .set(bearer())
      .send({ title: 'Rác không được thu gom', description: 'Khu vực tôi bị bỏ qua.' });
    expect(res.status).toBe(201);
  });

  test('TC_INT_050: GET /api/complaints → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/complaints')
      .set(bearer());
    expect(res.status).toBe(200);
  });
});

describe('TC_INT_051-058 — Resident Invoice Routes', () => {
  beforeEach(() => setupDefaultMocks('resident'));

  test('TC_INT_051: POST /api/invoices (valid data) → 201', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    docRef.set.mockResolvedValue({});
    const res = await request(app)
      .post('/api/invoices')
      .set(bearer())
      .send({
        invoiceId: 'inv-001',
        amount: 50000,
        currency: 'VND',
        dueDate: '2026-08-31',
        feeType: 'monthly',
      });
    expect(res.status).toBe(201);
  });

  test('TC_INT_052: POST /api/invoices (missing fields) → 400', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set(bearer())
      .send({ invoiceId: 'inv-001' });
    expect(res.status).toBe(400);
  });

  test('TC_INT_053: GET /api/invoices/current → 200 when invoice exists', async () => {
    collRef.get.mockResolvedValue(
      makeQuerySnap([{
        invoiceId: 'inv-001',
        userId: 'test-uid',
        amount: 50000,
        currency: 'VND',
        status: 'unpaid',
        dueDate: '2026-08-31',
        createdAt: new Date().toISOString(),
      }])
    );
    const res = await request(app)
      .get('/api/invoices/current')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_054: GET /api/invoices/current → 404 when no invoice', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/invoices/current')
      .set(bearer());
    expect(res.status).toBe(404);
  });

  test('TC_INT_055: GET /api/invoices/:id → 200 for correct user', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('resident'))
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ userId: 'test-uid', amount: 50000, invoiceId: 'inv-001' }),
      });
    const res = await request(app)
      .get('/api/invoices/inv-001')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_056: GET /api/invoices/:id → 404 for wrong user', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('resident'))
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ userId: 'other-user-uid', amount: 50000 }),
      });
    const res = await request(app)
      .get('/api/invoices/inv-999')
      .set(bearer());
    expect(res.status).toBe(404);
  });

  test('TC_INT_057: POST /api/invoices/:id/verify-payment → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('resident'))
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ userId: 'test-uid', status: 'unpaid', amount: 50000, orderCode: 12345 }),
      });
    const res = await request(app)
      .post('/api/invoices/inv-001/verify-payment')
      .set(bearer())
      .send({ orderCode: 12345 });
    expect([200, 201]).toContain(res.status);
  });

  test('TC_INT_058: POST /api/invoices/:id/verify-payment → 404 for wrong user', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('resident'))
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ userId: 'other-uid', status: 'unpaid', amount: 50000 }),
      });
    const res = await request(app)
      .post('/api/invoices/inv-999/verify-payment')
      .set(bearer())
      .send({ orderCode: 99999 });
    expect(res.status).toBe(404);
  });
});

// =============================================================================
// TC_INT_059-063 — Notification Routes
// =============================================================================
describe('TC_INT_059-063 — Notification Routes', () => {
  test('TC_INT_059: GET /api/notifications → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/notifications')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_060: POST /api/notifications/:id/read → 200', async () => {
    docRef.get
      .mockResolvedValueOnce({ exists: true, data: () => ({ userId: 'test-uid', read: false }) });
    const res = await request(app)
      .post('/api/notifications/notif-001/read')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_061: POST /api/notifications/read-all → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .post('/api/notifications/read-all')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_062: GET /api/notifications/settings → 200', async () => {
    docRef.get.mockResolvedValue({
      exists: true,
      data: () => ({ emailEnabled: true, pushEnabled: true }),
    });
    const res = await request(app)
      .get('/api/notifications/settings')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_063: POST /api/notifications/settings → 200', async () => {
    const res = await request(app)
      .post('/api/notifications/settings')
      .set(bearer())
      .send({ emailEnabled: false });
    expect(res.status).toBe(200);
  });
});

// =============================================================================
// TC_INT_068 — Resident Upcoming Schedules
// =============================================================================
describe('TC_INT_068 — Resident Upcoming Schedules', () => {
  test('GET /api/resident/upcoming-schedules → 200', async () => {
    docRef.get.mockResolvedValue(makeUserDoc('resident'));
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app)
      .get('/api/resident/upcoming-schedules')
      .set(bearer());
    expect(res.status).toBe(200);
  });
});

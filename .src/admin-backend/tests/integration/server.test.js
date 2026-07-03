'use strict';

const request = require('supertest');

// ─── Firebase mock ────────────────────────────────────────────────────────────
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
    add: jest.fn().mockResolvedValue({ id: 'new-id' }),
  };

  const db = { collection: jest.fn(() => collRef) };

  const auth = {
    verifyIdToken: jest.fn(),
    getUser: jest.fn().mockResolvedValue({
      uid: 'admin-uid',
      displayName: 'Admin User',
      phoneNumber: '',
      emailVerified: true,
    }),
    createUser: jest.fn().mockResolvedValue({ uid: 'new-user-uid' }),
    updateUser: jest.fn().mockResolvedValue({}),
    deleteUser: jest.fn().mockResolvedValue({}),
  };

  return { db, auth, admin: {}, _docRef: docRef, _collRef: collRef };
});

jest.mock('../../services/addressService', () => ({
  getProvinces: jest.fn().mockResolvedValue([{ code: '01', name: 'Hà Nội' }]),
  getWardsByProvince: jest.fn().mockResolvedValue([{ code: '001', name: 'Phường 1' }]),
}));

jest.mock('../../helpers/payosHelper', () => ({
  createPayOSPaymentSession: jest.fn().mockResolvedValue({ paymentUrl: 'https://pay.test/link', qrCode: null }),
  verifyPayOSPayment: jest.fn().mockResolvedValue({ success: true, message: 'ok' }),
}));

// ─── App + mock references ────────────────────────────────────────────────────
const app = require('../../server');
const { auth, _docRef: docRef, _collRef: collRef } = require('../../config/firebase');

// ─── Test helpers ─────────────────────────────────────────────────────────────
const bearer = (token = 'valid-token') => ({ Authorization: `Bearer ${token}` });

const makeUserDoc = (role = 'admin') => ({
  exists: true,
  id: 'admin-uid',
  data: () => ({
    uid: 'admin-uid',
    email: 'admin@test.com',
    fullName: 'Admin User',
    role,
    area: '',
    address: '',
    phone: '',
    emailVerified: true,
    createdAt: new Date().toISOString(),
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
beforeEach(() => {
  jest.clearAllMocks();

  auth.verifyIdToken.mockResolvedValue({ uid: 'admin-uid', email: 'admin@test.com', email_verified: true });
  auth.getUser.mockResolvedValue({ uid: 'admin-uid', displayName: 'Admin User', phoneNumber: '', emailVerified: true });

  docRef.get.mockResolvedValue(makeUserDoc('admin'));
  docRef.set.mockResolvedValue({});
  docRef.update.mockResolvedValue({});
  docRef.delete.mockResolvedValue({});
  collRef.doc.mockReturnValue(docRef);
  collRef.where.mockReturnThis();
  collRef.orderBy.mockReturnThis();
  collRef.limit.mockReturnThis();
  collRef.offset.mockReturnThis();
  collRef.count.mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
  });
  collRef.get.mockResolvedValue(makeQuerySnap([]));
  collRef.add.mockResolvedValue({ id: 'new-id' });

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ localId: 'admin-uid', idToken: 'fake-token', email: 'admin@test.com' }),
  });
});

// =============================================================================
// Health + basic smoke tests
// =============================================================================
describe('Health Check', () => {
  test('GET /health → 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// =============================================================================
// TC_INT_011-019 — Admin User Management Routes
// =============================================================================
describe('TC_INT_011-019 — Admin Routes', () => {
  test('TC_INT_011: GET /api/admin/users → 200 for admin', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([
      { uid: 'user-1', email: 'u1@test.com', fullName: 'User One', role: 'resident' },
    ]));
    const res = await request(app).get('/api/admin/users').set(bearer());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  test('TC_INT_012: GET /api/admin/users → 403 for non-admin', async () => {
    docRef.get.mockResolvedValue(makeUserDoc('resident'));
    const res = await request(app).get('/api/admin/users').set(bearer());
    expect(res.status).toBe(403);
  });

  test('TC_INT_013: GET /api/admin/users → 401 without token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  test('TC_INT_014: POST /api/admin/users (valid data) → 201', async () => {
    auth.createUser.mockResolvedValue({ uid: 'new-user-uid' });
    docRef.set.mockResolvedValue({});
    const res = await request(app)
      .post('/api/admin/users')
      .set(bearer())
      .send({ email: 'new@test.com', password: 'pass123', fullName: 'New User', role: 'resident' });
    expect(res.status).toBe(201);
  });

  test('TC_INT_015: POST /api/admin/users (missing fields) → 400', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set(bearer())
      .send({ email: 'new@test.com' });
    expect(res.status).toBe(400);
  });

  test('TC_INT_016: PUT /api/admin/users/:uid → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('admin'))  // ensureAdmin
      .mockResolvedValueOnce({                       // user to update
        exists: true,
        data: () => ({ uid: 'user-1', email: 'u1@test.com', fullName: 'User One', role: 'resident' }),
      });
    docRef.update.mockResolvedValue({});
    const res = await request(app)
      .put('/api/admin/users/user-1')
      .set(bearer())
      .send({ fullName: 'Updated Name', role: 'collector' });
    expect(res.status).toBe(200);
  });

  test('TC_INT_017: DELETE /api/admin/users/:uid → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('admin'))  // ensureAdmin
      .mockResolvedValueOnce({                       // user to delete
        exists: true,
        data: () => ({ uid: 'user-1', email: 'u1@test.com', fullName: 'User One', role: 'resident' }),
      });
    auth.deleteUser.mockResolvedValue({});
    docRef.delete.mockResolvedValue({});
    const res = await request(app)
      .delete('/api/admin/users/user-1')
      .set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_018: GET /api/admin/complaints → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app).get('/api/admin/complaints').set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_019: GET /api/admin/transactions → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app).get('/api/admin/transactions').set(bearer());
    expect(res.status).toBe(200);
  });
});

// =============================================================================
// TC_INT_064-067 — Admin Notification Management Routes
// =============================================================================
describe('TC_INT_064-067 — Admin Notification Routes', () => {
  test('TC_INT_064: GET /api/notifications/admin → 200', async () => {
    collRef.get.mockResolvedValue(makeQuerySnap([]));
    const res = await request(app).get('/api/notifications/admin').set(bearer());
    expect(res.status).toBe(200);
  });

  test('TC_INT_065: POST /api/notifications/admin (valid data) → 201', async () => {
    collRef.add.mockResolvedValue({ id: 'notif-001' });
    const res = await request(app)
      .post('/api/notifications/admin')
      .set(bearer())
      .send({ title: 'System Notice', message: 'Maintenance at midnight.', targetRole: 'all' });
    expect(res.status).toBe(201);
  });

  test('TC_INT_066: PUT /api/notifications/admin/:id → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('admin'))  // ensureAdmin
      .mockResolvedValueOnce({                       // notification doc
        exists: true,
        data: () => ({ title: 'Old Title', message: 'Old message', targetRole: 'all' }),
      });
    docRef.update.mockResolvedValue({});
    const res = await request(app)
      .put('/api/notifications/admin/notif-001')
      .set(bearer())
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
  });

  test('TC_INT_067: DELETE /api/notifications/admin/:id → 200', async () => {
    docRef.get
      .mockResolvedValueOnce(makeUserDoc('admin'))  // ensureAdmin
      .mockResolvedValueOnce({                       // notification doc
        exists: true,
        data: () => ({ title: 'Notice', message: 'Old' }),
      });
    docRef.delete.mockResolvedValue({});
    const res = await request(app)
      .delete('/api/notifications/admin/notif-001')
      .set(bearer());
    expect(res.status).toBe(200);
  });
});

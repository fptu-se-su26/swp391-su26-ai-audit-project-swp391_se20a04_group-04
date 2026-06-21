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
    getUser: jest.fn()
  },
  db: {
    collection: jest.fn(),
    batch: jest.fn(() => ({ set: jest.fn(), commit: jest.fn() }))
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
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
});

const app = require('../../server');

describe('Server Route Tests', () => {
  const setupDbMock = (role) => {
    const mockDoc = {
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: role }) }),
      set: jest.fn().mockResolvedValue(),
      update: jest.fn().mockResolvedValue(),
    };
    const mockQuery = {
      get: jest.fn().mockResolvedValue({ empty: true, forEach: () => {} }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    };
    
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue(mockDoc),
      where: jest.fn().mockReturnValue(mockQuery),
      orderBy: jest.fn().mockReturnValue(mockQuery),
      add: jest.fn().mockResolvedValue({ id: 'new_id' }),
      get: jest.fn().mockResolvedValue({ empty: true, forEach: () => {} })
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

  it('GET /api/schedules', async () => {
    scheduleService.getSchedules.mockResolvedValue([]);
    const res = await request(app).get('/api/schedules').query({ city: 'C', ward: 'W' });
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: 'A', email: 'a@a.com', password: 'abc' });
    expect(res.statusCode).toBe(201);
  });

  it('POST /api/auth/login', async () => {
    firebaseAdmin.auth.getUser.mockResolvedValue({ emailVerified: true });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: 'abc' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/manager/schedules', async () => {
    setupDbMock('manager');
    const res = await request(app).get('/api/manager/schedules').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/collector/schedules', async () => {
    setupDbMock('collector');
    collectorService.getDailySchedules.mockResolvedValue({ items: [] });
    const res = await request(app).get('/api/collector/schedules').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/notifications', async () => {
    notificationService.getNotifications.mockResolvedValue([]);
    const res = await request(app).get('/api/notifications').set('Authorization', 'Bearer token');
    expect(res.statusCode).toBe(200);
  });
});

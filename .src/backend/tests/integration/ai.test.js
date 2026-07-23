'use strict';

const request = require('supertest');

// Mock https module (factory creates the mock function, implementation is set in beforeEach)
jest.mock('https', () => {
  const originalHttps = jest.requireActual('https');
  return {
    ...originalHttps,
    request: jest.fn()
  };
});

// Mock Firebase Config
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

// Set fake API key for test environment
process.env.OPENROUTER_RESIDENT_API_KEY = 'fake-key';

const app = require('../../server');
const https = require('https');
const { auth, db, _docRef: docRef, _collRef: collRef } = require('../../config/firebase');

const bearer = (token = 'valid-token') => ({ Authorization: `Bearer ${token}` });

const makeUserDoc = (role = 'resident', uid = 'test-uid') => ({
  exists: true,
  id: uid,
  data: () => ({
    uid,
    email: 'test@test.com',
    fullName: 'Test User',
    role,
    area: 'Quận Sơn Trà, Đà Nẵng',
    address: '123 Test St',
    phone: '0123456789',
    emailVerified: true,
  }),
});

describe('AI Chat Route Security & Limits', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    auth.verifyIdToken.mockResolvedValue({ uid: 'test-uid', email: 'test@test.com', email_verified: true });

    // Re-apply mock implementation for https.request since resetAllMocks clears it
    https.request.mockImplementation((...args) => {
      const callback = args.find(arg => typeof arg === 'function');

      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            process.nextTick(() => {
              handler(JSON.stringify({
                choices: [{ message: { content: 'Xin chào, tôi là trợ lý EcoSchedule.' } }]
              }));
            });
          }
          if (event === 'end') {
            process.nextTick(() => {
              handler();
            });
          }
        })
      };

      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(() => {
          if (callback) {
            process.nextTick(() => {
              callback(mockResponse);
            });
          }
        })
      };

      return mockRequest;
    });

    // Restore firestore mock implementations after resetAllMocks
    db.collection.mockReturnValue(collRef);
    collRef.doc.mockReturnValue(docRef);
    collRef.where.mockReturnThis();
    collRef.orderBy.mockReturnThis();
    collRef.limit.mockReturnThis();
    collRef.offset.mockReturnThis();
    collRef.get.mockResolvedValue({ empty: true, docs: [] });
  });

  test('POST /api/ai/chat → 403 for unauthorized collector role', async () => {
    docRef.get.mockResolvedValue(makeUserDoc('collector'));

    const res = await request(app)
      .post('/api/ai/chat')
      .set(bearer())
      .send({ message: 'Lịch thu gom rác hôm nay thế nào?' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('không được cấp quyền');
  });

  test('POST /api/ai/chat → 400 if message is too long (> 500 chars)', async () => {
    docRef.get.mockResolvedValue(makeUserDoc('resident'));

    const hugeMessage = 'a'.repeat(501);
    const res = await request(app)
      .post('/api/ai/chat')
      .set(bearer())
      .send({ message: hugeMessage });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Tin nhắn quá dài');
  });

  test('POST /api/ai/chat → 400 if message is empty', async () => {
    docRef.get.mockResolvedValue(makeUserDoc('resident'));

    const res = await request(app)
      .post('/api/ai/chat')
      .set(bearer())
      .send({ message: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('không được để trống');
  });



  test('POST /api/ai/chat → 429 after 10 requests within a minute for the same user', async () => {
    // Generate a unique token/uid for this rate limiter test to avoid collision with other tests
    const testUid = 'rate-limited-user-uid';
    auth.verifyIdToken.mockResolvedValue({ uid: testUid, email: 'ratelimit@test.com', email_verified: true });
    docRef.get.mockResolvedValue(makeUserDoc('resident', testUid));

    // Send 10 valid requests
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/ai/chat')
        .set(bearer(`token-${i}`))
        .send({ message: `Hỏi lần thứ ${i + 1}` });
      if (res.status !== 200) {
        console.error('FAILED REQUEST:', res.status, res.body);
      }
      expect(res.status).toBe(200);
    }

    // The 11th request must be rate limited with 429
    const res11 = await request(app)
      .post('/api/ai/chat')
      .set(bearer('token-11'))
      .send({ message: 'Hỏi lần thứ 11' });

    expect(res11.status).toBe(429);
    expect(res11.body.error).toContain('quá nhiều yêu cầu');
  });
});

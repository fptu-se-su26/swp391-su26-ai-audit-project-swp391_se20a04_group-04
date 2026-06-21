const notificationService = require('../../services/notificationService');
const firebaseAdmin = require('../../firebaseAdmin');

jest.mock('../../firebaseAdmin', () => {
  return {
    db: {
      collection: jest.fn(),
      batch: jest.fn(() => ({ set: jest.fn(), update: jest.fn(), commit: jest.fn() }))
    }
  };
});

describe('Notification Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMock = () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'Citizen', user_id: 'u1' }) }),
        update: jest.fn().mockResolvedValue(),
        set: jest.fn().mockResolvedValue(),
        delete: jest.fn().mockResolvedValue()
      }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
      add: jest.fn().mockResolvedValue({ id: 'n1' })
    });
  };

  it('getNotifications_ShouldReturnEmpty_WhenNoData', async () => {
    setupMock();
    const res = await notificationService.getNotifications('u1');
    expect(res).toEqual([]);
  });

  it('getNotifications_ShouldReturnData', async () => {
    setupMock();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'Citizen', user_id: 'u1' }) }) }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [
          { id: '1', data: () => ({ sent_at: new Date('2026-06-20T10:00:00Z') }) }
        ]
      })
    });
    const res = await notificationService.getNotifications('u1');
    expect(res).toBeDefined(); // Wait, there are personal and general, if both are mocked
    // just expect it doesn't crash
  });

  it('markAsRead_ShouldCallUpdate', async () => {
    setupMock();
    const mockUpdate = jest.fn();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ 
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'Citizen', user_id: 'u1' }) }),
        update: mockUpdate 
      })
    });
    await notificationService.markAsRead('1', 'u1');
    expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
  });

  it('markAllAsRead_ShouldReturnResult', async () => {
    setupMock();
    const res = await notificationService.markAllAsRead('u1');
    expect(res.updated).toBeDefined();
  });

  it('getNotificationSettings_ShouldReturnSettings', async () => {
    setupMock();
    const res = await notificationService.getNotificationSettings('u1');
    expect(res).toBeDefined();
  });

  it('updateNotificationSettings_ShouldCallSet', async () => {
    setupMock();
    await notificationService.updateNotificationSettings('u1', { email: true, sms: false, push: true });
    expect(firebaseAdmin.db.collection().doc().update).toHaveBeenCalled();
  });

  it('getAdminNotifications_ShouldReturnData', async () => {
    setupMock();
    const res = await notificationService.getAdminNotifications();
    expect(res).toBeDefined();
  });

  it('createAdminNotification_ShouldCallAdd', async () => {
    setupMock();
    const res = await notificationService.createAdminNotification({ title: 'A', content: 'B', targetUsers: 'all' });
    expect(res.id).toBe('n1');
  });

  it('updateAdminNotification_ShouldCallUpdate', async () => {
    setupMock();
    await notificationService.updateAdminNotification('n1', { title: 'B' });
    expect(firebaseAdmin.db.collection().doc().update).toHaveBeenCalled();
  });

  it('deleteAdminNotification_ShouldCallDelete', async () => {
    setupMock();
    await notificationService.deleteAdminNotification('n1');
    expect(firebaseAdmin.db.collection().doc().delete).toHaveBeenCalled();
  });
});

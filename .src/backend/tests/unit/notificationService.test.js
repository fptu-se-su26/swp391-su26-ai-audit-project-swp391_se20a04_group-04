const notificationService = require('../../services/notificationService');
const firebaseAdmin = require('../../firebaseAdmin');

jest.mock('../../firebaseAdmin', () => {
  const mockFieldValue = { arrayUnion: jest.fn((val) => ['__arrayUnion__', val]) };
  return {
    admin: { firestore: { FieldValue: mockFieldValue } },
    db: {
      collection: jest.fn(),
      batch: jest.fn(() => ({ set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue() }))
    }
  };
});

describe('Notification Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================
  // getNotifications tests
  // =============================================

  it('getNotifications_ShouldReturnEmpty_WhenNoData', async () => {
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'resident' }) })
          })
        };
      }
      return {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] })
      };
    });
    const res = await notificationService.getNotifications('u1');
    expect(res).toEqual([]);
  });

  it('getNotifications_ShouldReturnPersonalNotifications', async () => {
    let callCount = 0;
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'resident' }) })
          })
        };
      }
      return {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              // personal notifications
              return Promise.resolve({
                empty: false,
                docs: [
                  { id: 'n1', data: () => ({ user_id: 'u1', title: 'Personal', sent_at: '2026-06-20T10:00:00Z' }) },
                ]
              });
            }
            // role notifications
            return Promise.resolve({ empty: true, docs: [] });
          })
        })
      };
    });

    const res = await notificationService.getNotifications('u1');
    expect(res).toHaveLength(1);
    expect(res[0].title).toBe('Personal');
  });

  it('getNotifications_ShouldMergePersonalAndRoleNotifications', async () => {
    let callCount = 0;
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'resident' }) })
          })
        };
      }
      return {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve({
                empty: false,
                docs: [
                  { id: 'n1', data: () => ({ user_id: 'u1', title: 'Personal', sent_at: '2026-06-20T10:00:00Z' }) },
                ]
              });
            }
            return Promise.resolve({
              empty: false,
              docs: [
                { id: 'n2', data: () => ({ targetRole: 'all', title: 'Broadcast', sent_at: '2026-06-21T10:00:00Z', read_by: [] }) },
                { id: 'n1', data: () => ({ user_id: 'u1', title: 'Personal Dup', sent_at: '2026-06-20T10:00:00Z' }) }, // duplicate
              ]
            });
          })
        })
      };
    });

    const res = await notificationService.getNotifications('u1');
    expect(res).toHaveLength(2);
    expect(res[0].title).toBe('Broadcast'); // newer first
  });

  it('getNotifications_ShouldHandleFirestoreTimestamp', async () => {
    let callCount = 0;
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: false }) // user not found => default 'resident'
          })
        };
      }
      return {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve({
                empty: false,
                docs: [
                  { id: 'n1', data: () => ({ user_id: 'u1', sent_at: { toDate: () => new Date('2026-06-20T10:00:00Z') } }) },
                ]
              });
            }
            return Promise.resolve({ empty: true, docs: [] });
          })
        })
      };
    });

    const res = await notificationService.getNotifications('u1');
    expect(res).toHaveLength(1);
    expect(res[0].sent_at).toBe('2026-06-20T10:00:00.000Z');
  });

  it('getNotifications_ShouldMarkRoleNotificationAsRead', async () => {
    let callCount = 0;
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'resident' }) })
          })
        };
      }
      return {
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return Promise.resolve({ empty: true, docs: [] });
            return Promise.resolve({
              empty: false,
              docs: [
                { id: 'n1', data: () => ({ targetRole: 'all', title: 'B', sent_at: '2026-06-20', read_by: ['u1'] }) },
              ]
            });
          })
        })
      };
    });

    const res = await notificationService.getNotifications('u1');
    expect(res[0].is_read).toBe(true); // read_by includes u1
  });

  // =============================================
  // markAsRead tests
  // =============================================

  it('markAsRead_ShouldCallUpdate_WhenPersonalNotification', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ user_id: 'u1' }) }),
        update: mockUpdate
      })
    });
    await notificationService.markAsRead('n1', 'u1');
    expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
  });

  it('markAsRead_ShouldThrow_WhenNotFound', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false })
      })
    });
    await expect(notificationService.markAsRead('n1', 'u1')).rejects.toThrow('Thông báo không tồn tại.');
  });

  it('markAsRead_ShouldUseArrayUnion_WhenRoleNotification', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ targetRole: 'all', user_id: 'other' }) }),
        update: mockUpdate
      })
    });
    await notificationService.markAsRead('n1', 'u1');
    expect(mockUpdate).toHaveBeenCalledWith({ read_by: expect.anything() });
  });

  it('markAsRead_ShouldThrow_WhenNotOwnerAndNoTargetRole', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ user_id: 'other_user' }) })
      })
    });
    await expect(notificationService.markAsRead('n1', 'u1')).rejects.toThrow('Bạn không có quyền thực hiện hành động này.');
  });

  // =============================================
  // markAllAsRead tests
  // =============================================

  it('markAllAsRead_ShouldReturnZero_WhenNothingToUpdate', async () => {
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'resident' }) })
          })
        };
      }
      return {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] })
      };
    });

    const res = await notificationService.markAllAsRead('u1');
    expect(res.updated).toBe(0);
  });

  it('markAllAsRead_ShouldUpdatePersonalNotifications', async () => {
    const mockBatchUpdate = jest.fn();
    const mockBatchCommit = jest.fn().mockResolvedValue();
    firebaseAdmin.db.batch.mockReturnValue({ update: mockBatchUpdate, commit: mockBatchCommit });

    let callCount = 0;
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'resident' }) })
          })
        };
      }
      return {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              empty: false,
              docs: [
                { id: 'n1', ref: { id: 'n1' }, data: () => ({ user_id: 'u1', is_read: false }) },
                { id: 'n2', ref: { id: 'n2' }, data: () => ({ user_id: 'u1', is_read: false }) },
              ]
            });
          }
          return Promise.resolve({ empty: true, docs: [] });
        })
      };
    });

    const res = await notificationService.markAllAsRead('u1');
    expect(res.updated).toBe(2);
    expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
    expect(mockBatchCommit).toHaveBeenCalled();
  });

  it('markAllAsRead_ShouldUpdateRoleNotifications', async () => {
    const mockBatchUpdate = jest.fn();
    const mockBatchCommit = jest.fn().mockResolvedValue();
    firebaseAdmin.db.batch.mockReturnValue({ update: mockBatchUpdate, commit: mockBatchCommit });

    let callCount = 0;
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'users') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'resident' }) })
          })
        };
      }
      return {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ empty: true, docs: [] });
          }
          return Promise.resolve({
            empty: false,
            docs: [
              { id: 'n1', ref: { id: 'n1' }, data: () => ({ targetRole: 'all', read_by: [] }) },
              { id: 'n2', ref: { id: 'n2' }, data: () => ({ targetRole: 'all', read_by: ['u1'] }) }, // already read
            ]
          });
        })
      };
    });

    const res = await notificationService.markAllAsRead('u1');
    expect(res.updated).toBe(1); // only n1, n2 already read
    expect(mockBatchCommit).toHaveBeenCalled();
  });

  // =============================================
  // getNotificationSettings tests
  // =============================================

  it('getNotificationSettings_ShouldReturnDefault_WhenUserNotFound', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false })
      })
    });

    const res = await notificationService.getNotificationSettings('u1');
    expect(res).toEqual({ email: true, sms: false, push: true });
  });

  it('getNotificationSettings_ShouldReturnUserSettings_WhenExists', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ notificationSettings: { email: false, sms: true, push: false } })
        })
      })
    });

    const res = await notificationService.getNotificationSettings('u1');
    expect(res).toEqual({ email: false, sms: true, push: false });
  });

  it('getNotificationSettings_ShouldReturnDefault_WhenNoSettingsField', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({}) // no notificationSettings field
        })
      })
    });

    const res = await notificationService.getNotificationSettings('u1');
    expect(res).toEqual({ email: true, sms: false, push: true });
  });

  // =============================================
  // updateNotificationSettings tests
  // =============================================

  it('updateNotificationSettings_ShouldCallUpdate', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockUpdate })
    });
    await notificationService.updateNotificationSettings('u1', { email: true, sms: false, push: true });
    expect(mockUpdate).toHaveBeenCalledWith({ notificationSettings: { email: true, sms: false, push: true } });
  });

  it('updateNotificationSettings_ShouldThrow_WhenInvalidTypes', async () => {
    await expect(notificationService.updateNotificationSettings('u1', { email: 'yes', sms: false, push: true }))
      .rejects.toThrow('Cấu hình nhận thông báo không hợp lệ. Vui lòng kiểm tra lại.');
  });

  it('updateNotificationSettings_ShouldThrow_WhenSmIsNotBoolean', async () => {
    await expect(notificationService.updateNotificationSettings('u1', { email: true, sms: 1, push: true }))
      .rejects.toThrow('Cấu hình nhận thông báo không hợp lệ. Vui lòng kiểm tra lại.');
  });

  // =============================================
  // getAdminNotifications tests
  // =============================================

  it('getAdminNotifications_ShouldReturnEmpty_WhenNoData', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ empty: true, docs: [] })
    });
    const res = await notificationService.getAdminNotifications();
    expect(res).toEqual([]);
  });

  it('getAdminNotifications_ShouldReturnSortedData', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [
          { id: 'n1', data: () => ({ title: 'Old', sent_at: '2026-01-01T00:00:00Z' }) },
          { id: 'n2', data: () => ({ title: 'New', sent_at: '2026-06-01T00:00:00Z' }) },
        ]
      })
    });
    const res = await notificationService.getAdminNotifications();
    expect(res).toHaveLength(2);
    expect(res[0].title).toBe('New'); // newest first
  });

  it('getAdminNotifications_ShouldFilterByRole', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      where: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            { id: 'n1', data: () => ({ title: 'For Manager', targetRole: 'manager', sent_at: '2026-06-01' }) },
          ]
        })
      })
    });
    const res = await notificationService.getAdminNotifications('manager');
    expect(res).toHaveLength(1);
  });

  it('getAdminNotifications_ShouldHandleFirestoreTimestamps', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'n1',
            data: () => ({
              title: 'A',
              sent_at: { toDate: () => new Date('2026-06-01T00:00:00Z') },
              created_at: { toDate: () => new Date('2026-05-30T00:00:00Z') }
            })
          },
        ]
      })
    });
    const res = await notificationService.getAdminNotifications();
    expect(res[0].sent_at).toBe('2026-06-01T00:00:00.000Z');
    expect(res[0].created_at).toBe('2026-05-30T00:00:00.000Z');
  });

  it('getAdminNotifications_ShouldHandleDateObjects', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'n1',
            data: () => ({
              title: 'A',
              sent_at: new Date('2026-06-01T00:00:00Z'),
              created_at: new Date('2026-05-30T00:00:00Z')
            })
          },
        ]
      })
    });
    const res = await notificationService.getAdminNotifications();
    expect(res[0].sent_at).toBe(new Date('2026-06-01T00:00:00Z').toISOString());
  });

  // =============================================
  // createAdminNotification tests
  // =============================================

  it('createAdminNotification_ShouldCallAdd', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: 'n1' })
    });
    const res = await notificationService.createAdminNotification({ title: 'A', message: 'B', targetRole: 'all' });
    expect(res.id).toBe('n1');
    expect(res.title).toBe('A');
    expect(res.content).toBe('B');
  });

  it('createAdminNotification_ShouldUseDefaults', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: 'n2' })
    });
    const res = await notificationService.createAdminNotification({ title: 'T' });
    expect(res.type).toBe('system');
    expect(res.targetRole).toBe('all');
  });

  // =============================================
  // updateAdminNotification tests
  // =============================================

  it('updateAdminNotification_ShouldCallUpdate', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockUpdate })
    });
    const res = await notificationService.updateAdminNotification('n1', { title: 'Updated', message: 'New content' });
    expect(mockUpdate).toHaveBeenCalled();
    expect(res.title).toBe('Updated');
  });

  // =============================================
  // deleteAdminNotification tests
  // =============================================

  it('deleteAdminNotification_ShouldCallDelete', async () => {
    const mockDelete = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ delete: mockDelete })
    });
    const res = await notificationService.deleteAdminNotification('n1');
    expect(mockDelete).toHaveBeenCalled();
    expect(res).toEqual({ id: 'n1', deleted: true });
  });
});

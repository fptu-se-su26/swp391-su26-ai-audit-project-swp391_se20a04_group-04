const reportService = require('../../services/reportService');
const firebaseAdmin = require('../../firebaseAdmin');

jest.mock('../../firebaseAdmin', () => {
  return {
    db: {
      collection: jest.fn()
    }
  };
});

describe('Report Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listReports_ShouldReturnAll_WhenNoFilter', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        docs: [
          { id: '1', data: () => ({ status: 'Open', updatedAt: new Date('2026-06-21T10:00:00Z') }) },
          { id: '2', data: () => ({ status: 'Closed', updatedAt: new Date('2026-06-20T10:00:00Z') }) }
        ]
      })
    });
    const results = await reportService.listReports();
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('1'); // newer
  });

  it('listReports_ShouldFilterByStatus', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        docs: [
          { id: '1', data: () => ({ status: 'open', updatedAt: new Date('2026-06-21T10:00:00Z') }) },
          { id: '2', data: () => ({ status: 'closed', updatedAt: new Date('2026-06-20T10:00:00Z') }) }
        ]
      })
    });
    const results = await reportService.listReports('open');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('getReportComments_ShouldReturnSortedComments', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      where: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          docs: [
            { id: 'c1', data: () => ({ reportId: '1', createdAt: new Date('2026-06-21T10:00:00Z') }) },
            { id: 'c2', data: () => ({ reportId: '1', createdAt: new Date('2026-06-20T10:00:00Z') }) }
          ]
        })
      })
    });
    const results = await reportService.getReportComments('1');
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('c2'); // older first
  });

  it('approveReport_ShouldThrowError_WhenNotFound', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false })
      })
    });
    await expect(reportService.approveReport('m1', 'Manager', 'r1'))
      .rejects.toThrow('Không tìm thấy phản ánh.');
  });

  it('approveReport_ShouldThrowError_WhenWrongStatus', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ status: 'open' }) })
      })
    });
    await expect(reportService.approveReport('m1', 'Manager', 'r1'))
      .rejects.toThrow('Chỉ có thể duyệt phản ánh ở trạng thái chờ duyệt (hiện tại: "open").');
  });

  it('approveReport_ShouldUpdateAndNotify_WhenApprovable', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    const mockSet = jest.fn().mockResolvedValue();
    const mockAdd = jest.fn().mockResolvedValue();
    
    // docs call for report, comment, notification
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'reports') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn()
              .mockResolvedValueOnce({ exists: true, data: () => ({ status: 'resolved_pending_approval', citizenId: 'c1', title: 'Rác' }) })
              .mockResolvedValueOnce({ exists: true, id: 'r1', data: () => ({ status: 'closed' }) }), // for return mapping
            update: mockUpdate
          })
        };
      }
      if (colName === 'report_comments') {
        return {
          doc: jest.fn().mockReturnValue({ set: mockSet, id: 'com1' })
        };
      }
      if (colName === 'notifications') {
        return { add: mockAdd };
      }
    });

    const result = await reportService.approveReport('m1', 'Manager', 'r1', { message: 'Ok' });
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});

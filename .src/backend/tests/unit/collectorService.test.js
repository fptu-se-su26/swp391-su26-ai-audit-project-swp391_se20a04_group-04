const collectorService = require('../../services/collectorService');
const firebaseAdmin = require('../../firebaseAdmin');

jest.mock('../../firebaseAdmin', () => {
  return {
    db: {
      collection: jest.fn(),
      batch: jest.fn(() => ({ set: jest.fn(), commit: jest.fn().mockResolvedValue() }))
    }
  };
});

describe('Collector Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDbWithRoutes = (assignDocs, schedDocs, routeDocs) => {
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'routes') {
        return { get: jest.fn().mockResolvedValue({ forEach: (cb) => routeDocs.forEach(cb) }) };
      }
      if (colName === 'route_assignments') {
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ forEach: (cb) => assignDocs.forEach(cb) })
        };
      }
      if (colName === 'collection_schedules') {
        return { get: jest.fn().mockResolvedValue({ forEach: (cb) => schedDocs.forEach(cb) }) };
      }
      return { where: jest.fn().mockReturnThis(), get: jest.fn().mockResolvedValue({ forEach: jest.fn(), docs: [], size: 0, empty: true }) };
    });
  };

  it('getDailySchedules_ShouldReturnAssignmentsAndSchedules', async () => {
    mockDbWithRoutes(
      [ // assignments
        { id: 'a1', data: () => ({ assignedDate: new Date(), routeId: 'r1', collectorId: 'c1' }) }
      ],
      [ // schedules
        { id: 's1', data: () => ({ schedule_date: new Date(), routeId: 'r1', assigned_collector: 'c1' }) }
      ],
      [ // routes
        { id: 'r1', data: () => ({ routeName: 'Route 1' }) }
      ]
    );

    const result = await collectorService.getDailySchedules('c1', 'Name', new Date().toISOString().slice(0, 10));
    expect(result.items).toHaveLength(2);
    expect(result.items[0].sourceType).toBe('assignment');
    expect(result.items[1].sourceType).toBe('schedule');
  });

  it('getAssignmentsInRange_ShouldReturnFilteredData', async () => {
    const today = new Date().toISOString().slice(0, 10);
    mockDbWithRoutes(
      [
        { id: 'a1', data: () => ({ assignedDate: new Date(), routeId: 'r1', collectorId: 'c1' }) },
        { id: 'a2', data: () => ({ assignedDate: new Date('2020-01-01'), routeId: 'r1', collectorId: 'c1' }) } // out of range
      ], [], []
    );

    const result = await collectorService.getAssignmentsInRange('c1', today, today);
    expect(result).toHaveLength(1);
    expect(result[0].assignmentId).toBe('a1');
  });

  it('getDashboardSummary_ShouldReturnStats', async () => {
    mockDbWithRoutes(
      [ { id: 'a1', data: () => ({ assignedDate: new Date(), routeId: 'r1', collectorId: 'c1', status: 'completed' }) } ],
      [], []
    );

    const result = await collectorService.getDashboardSummary('c1', 'Name', new Date().toISOString().slice(0, 10));
    expect(result.todayAssignments).toBe(1);
    expect(result.completedAssignments).toBe(1);
    expect(result.inProgressAssignments).toBe(0);
  });

  it('updateItemStatus_ShouldThrowError_WhenSourceTypeInvalid', async () => {
    await expect(collectorService.updateItemStatus('c1', 'Name', { sourceType: 'invalid', id: '1', action: 'start' }))
      .rejects.toThrow('sourceType không hợp lệ.');
  });

  it('updateItemStatus_ShouldThrowError_WhenNotFound', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: false }) })
    });
    await expect(collectorService.updateItemStatus('c1', 'Name', { sourceType: 'assignment', id: '1', action: 'start' }))
      .rejects.toThrow('Không tìm thấy lịch/tuyến được yêu cầu.');
  });

  it('updateItemStatus_ShouldStartAssignment', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ collectorId: 'c1', status: 'assigned' }) }),
        update: mockUpdate
      })
    });

    const result = await collectorService.updateItemStatus('c1', 'Name', { sourceType: 'assignment', id: '1', action: 'start' });
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'in_progress' }));
    expect(result.success).toBe(true);
  });

  it('updateReportStatus_ShouldUpdateAndComment', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    const mockSet = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'reports') {
        return {
          where: jest.fn().mockReturnThis(),
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ assignedTo: 'c1', status: 'in_progress' }) }),
            update: mockUpdate
          }),
          get: jest.fn().mockResolvedValue({ docs: [] })
        };
      }
      if (colName === 'report_comments') {
        return { doc: jest.fn().mockReturnValue({ set: mockSet, id: 'com1' }) };
      }
    });

    const result = await collectorService.updateReportStatus('c1', {}, 'r1', { status: 'resolved', imageUrls: ['img.png'], message: 'Da hoan thanh xu ly' });
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved_pending_approval' }));
    expect(mockSet).toHaveBeenCalled();
  });
});

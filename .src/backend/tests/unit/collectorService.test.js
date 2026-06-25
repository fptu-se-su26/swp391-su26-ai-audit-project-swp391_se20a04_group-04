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
      if (colName === 'reports') {
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ docs: [], empty: true }),
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: false }),
          })
        };
      }
      return { where: jest.fn().mockReturnThis(), get: jest.fn().mockResolvedValue({ forEach: jest.fn(), docs: [], size: 0, empty: true }) };
    });
  };

  // =============================================
  // getDailySchedules tests
  // =============================================

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

  it('getDailySchedules_ShouldReturnEmpty_WhenNoMatchingDate', async () => {
    mockDbWithRoutes(
      [{ id: 'a1', data: () => ({ assignedDate: '2020-01-01', routeId: 'r1', collectorId: 'c1' }) }],
      [],
      [{ id: 'r1', data: () => ({ routeName: 'Route 1' }) }]
    );

    const result = await collectorService.getDailySchedules('c1', 'Name', new Date().toISOString().slice(0, 10));
    expect(result.items).toHaveLength(0);
  });

  it('getDailySchedules_ShouldFilterSchedulesByCollectorName', async () => {
    const today = new Date();
    mockDbWithRoutes(
      [],
      [{ id: 's1', data: () => ({ schedule_date: today, routeId: 'r1', assigned_collector: 'CollectorName' }) }],
      [{ id: 'r1', data: () => ({ routeName: 'Route 1' }) }]
    );

    const result = await collectorService.getDailySchedules('c1', 'CollectorName', today.toISOString().slice(0, 10));
    expect(result.items).toHaveLength(1);
  });

  it('getDailySchedules_ShouldUseDefaultDate_WhenNoneProvided', async () => {
    mockDbWithRoutes([], [], []);
    const result = await collectorService.getDailySchedules('c1', 'Name');
    expect(result.date).toBe(new Date().toISOString().slice(0, 10));
  });

  // =============================================
  // getAssignmentsInRange tests
  // =============================================

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

  it('getAssignmentsInRange_ShouldReturnEmpty_WhenNoAssignments', async () => {
    mockDbWithRoutes([], [], []);
    const result = await collectorService.getAssignmentsInRange('c1', '2026-01-01', '2026-01-01');
    expect(result).toHaveLength(0);
  });

  it('getAssignmentsInRange_ShouldExcludeNullDateKeys', async () => {
    mockDbWithRoutes(
      [{ id: 'a1', data: () => ({ assignedDate: null, routeId: 'r1', collectorId: 'c1' }) }],
      [], []
    );
    const result = await collectorService.getAssignmentsInRange('c1', '2026-01-01', '2026-12-31');
    expect(result).toHaveLength(0);
  });

  // =============================================
  // getDashboardSummary tests
  // =============================================

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

  it('getDashboardSummary_ShouldCountInProgress', async () => {
    mockDbWithRoutes(
      [
        { id: 'a1', data: () => ({ assignedDate: new Date(), routeId: 'r1', collectorId: 'c1', status: 'in_progress' }) },
        { id: 'a2', data: () => ({ assignedDate: new Date(), routeId: 'r1', collectorId: 'c1', status: 'completed' }) },
      ],
      [], []
    );

    const result = await collectorService.getDashboardSummary('c1', 'Name', new Date().toISOString().slice(0, 10));
    expect(result.todayAssignments).toBe(2);
    expect(result.completedAssignments).toBe(1);
    expect(result.inProgressAssignments).toBe(1);
  });

  it('getDashboardSummary_ShouldCountPendingReports', async () => {
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'routes') {
        return { get: jest.fn().mockResolvedValue({ forEach: jest.fn() }) };
      }
      if (colName === 'route_assignments') {
        return { where: jest.fn().mockReturnThis(), get: jest.fn().mockResolvedValue({ forEach: jest.fn() }) };
      }
      if (colName === 'collection_schedules') {
        return { get: jest.fn().mockResolvedValue({ forEach: jest.fn() }) };
      }
      if (colName === 'reports') {
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({
            docs: [
              { id: 'r1', data: () => ({ assignedTo: 'c1', status: 'assigned', title: 'A' }) },
              { id: 'r2', data: () => ({ assignedTo: 'c1', status: 'resolved', title: 'B' }) },
            ]
          })
        };
      }
      return { where: jest.fn().mockReturnThis(), get: jest.fn().mockResolvedValue({ forEach: jest.fn(), docs: [], empty: true }) };
    });

    const result = await collectorService.getDashboardSummary('c1', 'Name', new Date().toISOString().slice(0, 10));
    expect(result.pendingReports).toBe(1); // only 'assigned' is pending
  });

  // =============================================
  // getAssignedReports tests
  // =============================================

  it('getAssignedReports_ShouldReturnSortedReports', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        docs: [
          { id: 'r1', data: () => ({ assignedTo: 'c1', status: 'assigned', title: 'Old', updatedAt: '2026-01-01' }) },
          { id: 'r2', data: () => ({ assignedTo: 'c1', status: 'in_progress', title: 'New', updatedAt: '2026-06-01' }) },
        ]
      })
    });

    const result = await collectorService.getAssignedReports('c1');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('r2'); // newer first
    expect(result[1].id).toBe('r1');
  });

  it('getAssignedReports_ShouldReturnEmpty_WhenNoReports', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs: [] })
    });

    const result = await collectorService.getAssignedReports('c1');
    expect(result).toHaveLength(0);
  });

  // =============================================
  // getReportById tests
  // =============================================

  it('getReportById_ShouldThrow404_WhenNotFound', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false })
      })
    });

    await expect(collectorService.getReportById('r1', 'c1'))
      .rejects.toThrow('Không tìm thấy phản ánh.');
  });

  it('getReportById_ShouldThrow403_WhenNotAssigned', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'r1',
          data: () => ({ assignedTo: 'other_collector', status: 'assigned', title: 'T' })
        })
      })
    });

    await expect(collectorService.getReportById('r1', 'c1'))
      .rejects.toThrow('Bạn không có quyền xem phản ánh này.');
  });

  it('getReportById_ShouldReturnReport_WhenValid', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'r1',
          data: () => ({ assignedTo: 'c1', status: 'assigned', title: 'Test Report' })
        })
      })
    });

    const result = await collectorService.getReportById('r1', 'c1');
    expect(result.id).toBe('r1');
    expect(result.title).toBe('Test Report');
  });

  // =============================================
  // getReportComments tests
  // =============================================

  it('getReportComments_ShouldReturnSortedComments', async () => {
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'reports') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              exists: true,
              id: 'r1',
              data: () => ({ assignedTo: 'c1', status: 'assigned' })
            })
          })
        };
      }
      if (colName === 'report_comments') {
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({
            docs: [
              { id: 'com2', data: () => ({ reportId: 'r1', userId: 'c1', message: 'Later', createdAt: '2026-06-02' }) },
              { id: 'com1', data: () => ({ reportId: 'r1', userId: 'c1', message: 'Earlier', createdAt: '2026-06-01' }) },
            ]
          })
        };
      }
    });

    const result = await collectorService.getReportComments('r1', 'c1');
    expect(result).toHaveLength(2);
    expect(result[0].message).toBe('Earlier'); // oldest first
    expect(result[1].message).toBe('Later');
  });

  // =============================================
  // updateItemStatus tests
  // =============================================

  it('updateItemStatus_ShouldThrowError_WhenSourceTypeInvalid', async () => {
    await expect(collectorService.updateItemStatus('c1', 'Name', { sourceType: 'invalid', id: '1', action: 'start' }))
      .rejects.toThrow('sourceType không hợp lệ.');
  });

  it('updateItemStatus_ShouldThrowError_WhenMissingFields', async () => {
    await expect(collectorService.updateItemStatus('c1', 'Name', { sourceType: '', id: '', action: '' }))
      .rejects.toThrow('Thiếu thông tin sourceType, id hoặc action.');
  });

  it('updateItemStatus_ShouldThrowError_WhenNotFound', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: false }) })
    });
    await expect(collectorService.updateItemStatus('c1', 'Name', { sourceType: 'assignment', id: '1', action: 'start' }))
      .rejects.toThrow('Không tìm thấy lịch/tuyến được yêu cầu.');
  });

  it('updateItemStatus_ShouldThrow403_WhenNotOwner', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ collectorId: 'other_collector', status: 'assigned' })
        })
      })
    });
    await expect(collectorService.updateItemStatus('c1', 'Name', { sourceType: 'assignment', id: '1', action: 'start' }))
      .rejects.toThrow('Bạn không có quyền cập nhật tuyến này.');
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

  it('updateItemStatus_ShouldThrow_WhenStartingFromInvalidStatus', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ collectorId: 'c1', status: 'completed' })
        })
      })
    });

    await expect(collectorService.updateItemStatus('c1', 'Name', { sourceType: 'assignment', id: '1', action: 'start' }))
      .rejects.toThrow('Không thể bắt đầu khi trạng thái hiện tại là "completed".');
  });

  it('updateItemStatus_ShouldComplete_WhenInProgressWithImages', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ collectorId: 'c1', status: 'in_progress' }) }),
        update: mockUpdate
      })
    });

    const result = await collectorService.updateItemStatus('c1', 'Name', {
      sourceType: 'assignment', id: '1', action: 'complete', imageUrls: ['img1.jpg']
    });
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
    expect(result.success).toBe(true);
  });

  it('updateItemStatus_ShouldThrow_WhenCompleteWithoutImages', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ collectorId: 'c1', status: 'in_progress' }) })
      })
    });

    await expect(collectorService.updateItemStatus('c1', 'Name', {
      sourceType: 'assignment', id: '1', action: 'complete', imageUrls: []
    })).rejects.toThrow('Vui lòng upload ít nhất 1 ảnh minh chứng khi hoàn thành.');
  });

  it('updateItemStatus_ShouldThrow_WhenCompleteFromAssignedStatus', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ collectorId: 'c1', status: 'assigned' }) })
      })
    });

    await expect(collectorService.updateItemStatus('c1', 'Name', {
      sourceType: 'assignment', id: '1', action: 'complete', imageUrls: ['img.jpg']
    })).rejects.toThrow('Không thể hoàn thành khi trạng thái hiện tại là "assigned".');
  });

  it('updateItemStatus_ShouldReportIncident_WhenValidDescription', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    const mockNotifCollection = {
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ collectorId: 'c1', status: 'in_progress', ward: 'W1', route_name: 'R1' }) }),
        update: mockUpdate
      })
    };
    
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'route_assignments') return mockNotifCollection;
      if (colName === 'routes') {
        return { get: jest.fn().mockResolvedValue({ forEach: jest.fn() }) };
      }
      if (colName === 'users') {
        return { where: jest.fn().mockReturnThis(), get: jest.fn().mockResolvedValue({ empty: true, docs: [], size: 0 }) };
      }
      return mockNotifCollection;
    });

    const result = await collectorService.updateItemStatus('c1', 'Name', {
      sourceType: 'assignment', id: '1', action: 'incident',
      incidentType: 'traffic', description: 'Đường bị ngập nước không thể đi qua được'
    });
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'delayed' }));
    expect(result.success).toBe(true);
  });

  it('updateItemStatus_ShouldThrow_WhenIncidentDescriptionTooShort', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ collectorId: 'c1', status: 'in_progress' }) })
      })
    });

    await expect(collectorService.updateItemStatus('c1', 'Name', {
      sourceType: 'assignment', id: '1', action: 'incident',
      description: 'Too short'
    })).rejects.toThrow('Mô tả sự cố phải từ 20 đến 1000 ký tự.');
  });

  it('updateItemStatus_ShouldThrow_WhenActionInvalid', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ collectorId: 'c1', status: 'assigned' }) })
      })
    });

    await expect(collectorService.updateItemStatus('c1', 'Name', {
      sourceType: 'assignment', id: '1', action: 'invalid_action'
    })).rejects.toThrow('action không hợp lệ. Dùng start, complete hoặc incident.');
  });

  it('updateItemStatus_ShouldWorkForScheduleSourceType', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ assigned_collector: 'c1', status: 'assigned' })
        }),
        update: mockUpdate
      })
    });

    const result = await collectorService.updateItemStatus('c1', 'Name', {
      sourceType: 'schedule', id: 's1', action: 'start'
    });
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'in_progress' }));
  });

  // =============================================
  // updateReportStatus tests
  // =============================================

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

  it('updateReportStatus_ShouldThrow404_WhenReportNotFound', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false })
      })
    });

    await expect(collectorService.updateReportStatus('c1', {}, 'r1', { status: 'in_progress' }))
      .rejects.toThrow('Không tìm thấy phản ánh.');
  });

  it('updateReportStatus_ShouldThrow403_WhenNotAssigned', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ assignedTo: 'other', status: 'in_progress' })
        })
      })
    });

    await expect(collectorService.updateReportStatus('c1', {}, 'r1', { status: 'in_progress' }))
      .rejects.toThrow('Bạn không có quyền cập nhật phản ánh này.');
  });

  it('updateReportStatus_ShouldStartReport', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    const mockSet = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockImplementation((colName) => {
      if (colName === 'reports') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ assignedTo: 'c1', status: 'assigned' })
            }),
            update: mockUpdate
          })
        };
      }
      if (colName === 'report_comments') {
        return { doc: jest.fn().mockReturnValue({ set: mockSet, id: 'com1' }) };
      }
    });

    const result = await collectorService.updateReportStatus('c1', { fullName: 'Collector' }, 'r1', { status: 'in_progress', message: '' });
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'in_progress' }));
    expect(mockSet).toHaveBeenCalled();
  });

  it('updateReportStatus_ShouldThrow_WhenResolvingWithShortMessage', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ assignedTo: 'c1', status: 'in_progress' })
        })
      })
    });

    await expect(collectorService.updateReportStatus('c1', {}, 'r1', {
      status: 'resolved', message: 'short', imageUrls: ['img.jpg']
    })).rejects.toThrow('Mô tả kết quả xử lý phải có ít nhất 10 ký tự.');
  });

  it('updateReportStatus_ShouldThrow_WhenResolvingWithoutImages', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ assignedTo: 'c1', status: 'in_progress' })
        })
      })
    });

    await expect(collectorService.updateReportStatus('c1', {}, 'r1', {
      status: 'resolved', message: 'Da hoan thanh xu ly day du', imageUrls: []
    })).rejects.toThrow('Vui lòng upload ít nhất 1 ảnh đối chứng khi hoàn thành.');
  });

  it('updateReportStatus_ShouldThrow_WhenInvalidTransition', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ assignedTo: 'c1', status: 'resolved' })
        })
      })
    });

    await expect(collectorService.updateReportStatus('c1', {}, 'r1', { status: 'in_progress' }))
      .rejects.toThrow('Không thể bắt đầu xử lý khi trạng thái là "resolved".');
  });

  it('updateReportStatus_ShouldThrow_WhenStatusIsInvalid', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ assignedTo: 'c1', status: 'in_progress' })
        })
      })
    });

    await expect(collectorService.updateReportStatus('c1', {}, 'r1', { status: 'garbage_status' }))
      .rejects.toThrow('Trạng thái không hợp lệ. Dùng in_progress hoặc resolved_pending_approval.');
  });

  // =============================================
  // normalizeStatus tests
  // =============================================

  it('normalizeStatus_ShouldNormalizeStatusStrings', () => {
    expect(collectorService.normalizeStatus('Assigned')).toBe('assigned');
    expect(collectorService.normalizeStatus('In Progress')).toBe('in_progress');
    expect(collectorService.normalizeStatus(null)).toBe('assigned');
    expect(collectorService.normalizeStatus(undefined)).toBe('assigned');
    expect(collectorService.normalizeStatus('')).toBe('assigned');
  });
});

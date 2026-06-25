const complaintService = require('../../services/complaintService');
const firebaseAdmin = require('../../firebaseAdmin');

jest.mock('../../firebaseAdmin', () => {
  return {
    db: {
      collection: jest.fn()
    }
  };
});

describe('Complaint Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================
  // createComplaint tests
  // =============================================

  it('createComplaint_ShouldCreate_WhenDataIsValid', async () => {
    const mockAdd = jest.fn().mockResolvedValue({ id: 'c1' });
    firebaseAdmin.db.collection.mockReturnValue({ add: mockAdd });

    const result = await complaintService.createComplaint('u1', 'User', {
      title: 'Rác tràn', description: 'Nhiều rác quá', type: 'Môi trường', city: 'A', ward: 'B', neighborhood: 'C'
    });

    expect(result.id).toBe('c1');
    expect(result.title).toBe('Rác tràn');
    expect(mockAdd).toHaveBeenCalled();
  });

  it('createComplaint_ShouldThrowError_WhenTitleMissing', async () => {
    await expect(complaintService.createComplaint('u1', 'User', { description: 'Nhiều rác quá', type: 'Môi trường' }))
      .rejects.toThrow('Tiêu đề phản ánh không được để trống.');
  });

  it('createComplaint_ShouldThrowError_WhenDescriptionMissing', async () => {
    await expect(complaintService.createComplaint('u1', 'User', { title: 'T', type: 'Môi trường' }))
      .rejects.toThrow('Nội dung phản ánh không được để trống.');
  });

  it('createComplaint_ShouldThrowError_WhenTypeMissing', async () => {
    await expect(complaintService.createComplaint('u1', 'User', { title: 'T', description: 'D' }))
      .rejects.toThrow('Loại phản ánh không hợp lệ.');
  });

  it('createComplaint_ShouldThrowError_WhenTitleIsOnlyWhitespace', async () => {
    await expect(complaintService.createComplaint('u1', 'User', { title: '   ', description: 'D', type: 'T' }))
      .rejects.toThrow('Tiêu đề phản ánh không được để trống.');
  });

  it('createComplaint_ShouldThrowError_WhenDescriptionIsOnlyWhitespace', async () => {
    await expect(complaintService.createComplaint('u1', 'User', { title: 'T', description: '   ', type: 'T' }))
      .rejects.toThrow('Nội dung phản ánh không được để trống.');
  });

  it('createComplaint_ShouldThrowError_WhenTypeIsOnlyWhitespace', async () => {
    await expect(complaintService.createComplaint('u1', 'User', { title: 'T', description: 'D', type: '   ' }))
      .rejects.toThrow('Loại phản ánh không hợp lệ.');
  });

  it('createComplaint_ShouldUseDefaultUserName_WhenNameIsEmpty', async () => {
    const mockAdd = jest.fn().mockResolvedValue({ id: 'c2' });
    firebaseAdmin.db.collection.mockReturnValue({ add: mockAdd });

    const result = await complaintService.createComplaint('u1', '', {
      title: 'T', description: 'D', type: 'Env'
    });

    expect(result.userName).toBe('Cư dân');
  });

  it('createComplaint_ShouldHandleOptionalFields', async () => {
    const mockAdd = jest.fn().mockResolvedValue({ id: 'c3' });
    firebaseAdmin.db.collection.mockReturnValue({ add: mockAdd });

    const result = await complaintService.createComplaint('u1', 'User', {
      title: 'T', description: 'D', type: 'Env'
      // no city, ward, neighborhood
    });

    expect(result.city).toBe('');
    expect(result.ward).toBe('');
    expect(result.neighborhood).toBe('');
  });

  // =============================================
  // getUserComplaints tests
  // =============================================

  it('getUserComplaints_ShouldReturnEmpty_WhenNoComplaints', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      where: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ empty: true })
      })
    });

    const result = await complaintService.getUserComplaints('u1');
    expect(result).toEqual([]);
  });

  it('getUserComplaints_ShouldReturnSortedList_WhenHasComplaints', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      where: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            { id: '1', data: () => ({ created_at: '2026-06-20T10:00:00Z' }) },
            { id: '2', data: () => ({ created_at: '2026-06-21T10:00:00Z' }) },
            { id: '3', data: () => ({}) } // missing created_at case
          ]
        })
      })
    });

    const result = await complaintService.getUserComplaints('u1');
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('2'); // Mới nhất lên đầu
    expect(result[1].id).toBe('1');
    expect(result[2].id).toBe('3');
  });

  // =============================================
  // getAllComplaints tests
  // =============================================

  it('getAllComplaints_ShouldReturnEmpty_WhenNoComplaints', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      get: jest.fn().mockResolvedValue({ empty: true })
    });

    const result = await complaintService.getAllComplaints();
    expect(result).toEqual([]);
  });

  it('getAllComplaints_ShouldReturnAllSortedByDate', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [
          { id: 'c1', data: () => ({ title: 'A', created_at: '2026-01-01T00:00:00Z' }) },
          { id: 'c2', data: () => ({ title: 'B', created_at: '2026-06-01T00:00:00Z' }) },
          { id: 'c3', data: () => ({ title: 'C' }) }, // no created_at
        ]
      })
    });

    const result = await complaintService.getAllComplaints();
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('c2'); // Newest first
    expect(result[1].id).toBe('c1');
    expect(result[2].id).toBe('c3'); // No date => time 0 => last
  });

  // =============================================
  // updateComplaintStatus tests
  // =============================================

  it('updateComplaintStatus_ShouldThrow_WhenStatusInvalid', async () => {
    await expect(complaintService.updateComplaintStatus('c1', 'm1', 'Manager', { status: 'invalid_status', comment: '' }))
      .rejects.toThrow('Trạng thái không hợp lệ. Chỉ chấp nhận: in_resolve, resolved, rejected.');
  });

  it('updateComplaintStatus_ShouldThrow_WhenStatusEmpty', async () => {
    await expect(complaintService.updateComplaintStatus('c1', 'm1', 'Manager', { status: '', comment: '' }))
      .rejects.toThrow('Trạng thái không hợp lệ. Chỉ chấp nhận: in_resolve, resolved, rejected.');
  });

  it('updateComplaintStatus_ShouldThrow_WhenRejectedWithoutComment', async () => {
    await expect(complaintService.updateComplaintStatus('c1', 'm1', 'Manager', { status: 'rejected', comment: '' }))
      .rejects.toThrow('Vui lòng nhập lý do từ chối phản ánh.');
  });

  it('updateComplaintStatus_ShouldThrow_WhenRejectedWithWhitespaceComment', async () => {
    await expect(complaintService.updateComplaintStatus('c1', 'm1', 'Manager', { status: 'rejected', comment: '   ' }))
      .rejects.toThrow('Vui lòng nhập lý do từ chối phản ánh.');
  });

  it('updateComplaintStatus_ShouldThrow_WhenComplaintNotFound', async () => {
    const mockGet = jest.fn().mockResolvedValue({ exists: false });
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ get: mockGet })
    });

    await expect(complaintService.updateComplaintStatus('c1', 'm1', 'Manager', { status: 'resolved', comment: 'ok' }))
      .rejects.toThrow('Không tìm thấy phản ánh với ID đã cung cấp.');
  });

  it('updateComplaintStatus_ShouldResolve_WhenValidData', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    const mockGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ title: 'Test', status: 'Open', userId: 'u1' })
    });
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ get: mockGet, update: mockUpdate })
    });

    const result = await complaintService.updateComplaintStatus('c1', 'm1', 'Manager', { status: 'resolved', comment: 'Đã xử lý' });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'resolved',
      reply: 'Đã xử lý',
      replied_by: 'Manager',
    }));
    expect(result.id).toBe('c1');
    expect(result.status).toBe('resolved');
  });

  it('updateComplaintStatus_ShouldReject_WhenValidData', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    const mockGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ title: 'Test', status: 'Open', userId: 'u1' })
    });
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ get: mockGet, update: mockUpdate })
    });

    const result = await complaintService.updateComplaintStatus('c1', 'm1', 'Manager', { status: 'rejected', comment: 'Không hợp lệ' });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'rejected',
      reply: 'Không hợp lệ',
    }));
    expect(result.status).toBe('rejected');
  });

  it('updateComplaintStatus_ShouldSetInResolve_WhenStatusIsInResolve', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    const mockGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ title: 'Test', status: 'Open' })
    });
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ get: mockGet, update: mockUpdate })
    });

    const result = await complaintService.updateComplaintStatus('c1', 'm1', 'Manager', { status: 'in_resolve', comment: '' });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'in_resolve',
    }));
    expect(result.status).toBe('in_resolve');
  });

  it('updateComplaintStatus_ShouldUseManagerIdAsFallback_WhenNameEmpty', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    const mockGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ title: 'Test', status: 'Open' })
    });
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({ get: mockGet, update: mockUpdate })
    });

    const result = await complaintService.updateComplaintStatus('c1', 'm1', '', { status: 'resolved', comment: 'ok' });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      replied_by: 'm1',
    }));
  });
});

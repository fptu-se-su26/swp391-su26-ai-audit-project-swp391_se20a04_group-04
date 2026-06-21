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
});

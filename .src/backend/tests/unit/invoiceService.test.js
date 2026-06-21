const invoiceService = require('../../services/invoiceService');
const firebaseAdmin = require('../../firebaseAdmin');

jest.mock('../../firebaseAdmin', () => {
  return {
    db: {
      collection: jest.fn()
    }
  };
});

describe('Invoice Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getLatestInvoiceForUser_ShouldReturnNull_WhenEmpty', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      where: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ empty: true })
      })
    });
    const result = await invoiceService.getLatestInvoiceForUser('u1');
    expect(result).toBeNull();
  });

  it('getLatestInvoiceForUser_ShouldReturnSorted_WhenHasData', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      where: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            { id: '1', data: () => ({ createdAt: new Date('2026-06-20T10:00:00Z') }) },
            { id: '2', data: () => ({ createdAt: { toDate: () => new Date('2026-06-21T10:00:00Z') } }) },
            { id: '3', data: () => ({ createdAt: { _seconds: 1672531200 } }) }
          ]
        })
      })
    });
    const result = await invoiceService.getLatestInvoiceForUser('u1');
    expect(result.id).toBe('2');
  });

  it('getInvoiceById_ShouldReturnNull_WhenNotExists', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false })
      })
    });
    const result = await invoiceService.getInvoiceById('inv1');
    expect(result).toBeNull();
  });

  it('getInvoiceById_ShouldReturnData_WhenExists', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'inv1',
          data: () => ({ amount: 100 })
        })
      })
    });
    const result = await invoiceService.getInvoiceById('inv1');
    expect(result.amount).toBe(100);
  });

  it('createOrUpdateInvoice_ShouldThrowError_WhenMissingId', async () => {
    await expect(invoiceService.createOrUpdateInvoice({ amount: 100 }))
      .rejects.toThrow('invoiceId is required');
  });

  it('createOrUpdateInvoice_ShouldSetData', async () => {
    const mockSet = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        set: mockSet,
        get: jest.fn().mockResolvedValue({ exists: true, id: 'inv1', data: () => ({ amount: 100 }) })
      })
    });

    const result = await invoiceService.createOrUpdateInvoice({ invoiceId: 'inv1', amount: 100, dueDate: '2026-07-01' });
    expect(mockSet).toHaveBeenCalled();
    expect(result.amount).toBe(100);
  });

  it('updateInvoice_ShouldUpdateData', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        update: mockUpdate,
        get: jest.fn().mockResolvedValue({ exists: true, id: 'inv1', data: () => ({ amount: 200 }) })
      })
    });

    const result = await invoiceService.updateInvoice('inv1', { amount: 200, paidAt: '2026-07-01' });
    expect(mockUpdate).toHaveBeenCalled();
    expect(result.amount).toBe(200);
  });
});

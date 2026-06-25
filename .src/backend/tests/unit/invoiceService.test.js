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

  // =============================================
  // getLatestInvoiceForUser tests
  // =============================================

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

  // =============================================
  // getInvoiceById tests
  // =============================================

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

  // =============================================
  // serializeInvoice tests (via getInvoiceById)
  // =============================================

  it('serializeInvoice_ShouldHandleFirestoreTimestamp', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'inv1',
          data: () => ({
            amount: 100,
            createdAt: { toDate: () => new Date('2026-06-01T00:00:00Z') },
            dueDate: new Date('2026-07-01T00:00:00Z'),
          })
        })
      })
    });
    const result = await invoiceService.getInvoiceById('inv1');
    expect(result.createdAt).toBe('2026-06-01T00:00:00.000Z');
    expect(result.dueDate).toBe('2026-07-01T00:00:00.000Z');
  });

  it('serializeInvoice_ShouldHandleSecondsTimestamp', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'inv1',
          data: () => ({
            amount: 100,
            createdAt: { _seconds: 1672531200 }, // 2023-01-01
            dueDate: { seconds: 1675209600 },    // 2023-02-01
          })
        })
      })
    });
    const result = await invoiceService.getInvoiceById('inv1');
    expect(result.createdAt).toContain('2023');
    expect(result.dueDate).toContain('2023');
  });

  it('serializeInvoice_ShouldHandleStringDate', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'inv1',
          data: () => ({
            amount: 100,
            createdAt: '2026-06-01T00:00:00Z',
            paidAt: null,
          })
        })
      })
    });
    const result = await invoiceService.getInvoiceById('inv1');
    expect(result.createdAt).toBe('2026-06-01T00:00:00.000Z');
    expect(result.paidAt).toBeNull();
  });

  // =============================================
  // createOrUpdateInvoice tests
  // =============================================

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

  it('createOrUpdateInvoice_ShouldHandleAllFields', async () => {
    const mockSet = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        set: mockSet,
        get: jest.fn().mockResolvedValue({ exists: true, id: 'inv1', data: () => ({ amount: 200 }) })
      })
    });

    await invoiceService.createOrUpdateInvoice({
      invoiceId: 'inv1', amount: 200, billingMonth: 6, billingYear: 2026,
      createdAt: '2026-06-01', dueDate: '2026-07-01', paidAt: '2026-06-15',
      updatedAt: '2026-06-01'
    });

    const calledArg = mockSet.mock.calls[0][0];
    expect(calledArg.amount).toBe(200);
    expect(calledArg.billingMonth).toBe(6);
    expect(calledArg.billingYear).toBe(2026);
  });

  // =============================================
  // updateInvoice tests
  // =============================================

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

  it('updateInvoice_ShouldThrow_WhenNoFieldsProvided', async () => {
    await expect(invoiceService.updateInvoice('inv1', {}))
      .rejects.toThrow('No invoice fields provided to update');
  });

  it('updateInvoice_ShouldFilterUndefinedValues', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        update: mockUpdate,
        get: jest.fn().mockResolvedValue({ exists: true, id: 'inv1', data: () => ({ status: 'paid' }) })
      })
    });

    await invoiceService.updateInvoice('inv1', { status: 'paid' });
    const calledArg = mockUpdate.mock.calls[0][0];
    // amount, billingMonth, billingYear should be filtered out (undefined)
    expect(calledArg.status).toBe('paid');
    expect(calledArg.amount).toBeUndefined();
  });

  it('updateInvoice_ShouldHandlePaidAtNull', async () => {
    const mockUpdate = jest.fn().mockResolvedValue();
    firebaseAdmin.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        update: mockUpdate,
        get: jest.fn().mockResolvedValue({ exists: true, id: 'inv1', data: () => ({ amount: 100 }) })
      })
    });

    await invoiceService.updateInvoice('inv1', { status: 'unpaid', paidAt: null });
    const calledArg = mockUpdate.mock.calls[0][0];
    expect(calledArg.paidAt).toBeNull();
  });
});

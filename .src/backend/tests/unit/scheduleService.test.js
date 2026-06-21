const { getSchedules } = require('../../services/scheduleService');
const firebaseAdmin = require('../../firebaseAdmin');

jest.mock('../../firebaseAdmin', () => {
  return {
    db: {
      collection: jest.fn()
    }
  };
});

describe('Schedule Service Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSnapshot = (schedules) => {
    firebaseAdmin.db.collection.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        empty: schedules.length === 0,
        forEach: (callback) => schedules.forEach(callback)
      })
    });
  };

  it('getSchedules_ShouldReturnMatchingSchedules_WhenCityAndWardProvided', async () => {
    mockSnapshot([
      { id: '1', data: () => ({ city: 'Đà Nẵng', ward: 'Phường Mỹ An', neighborhood: 'Tổ 12', schedule_date: '2026-07-01T08:00:00.000Z' }) }
    ]);
    const result = await getSchedules({ city: 'Đà Nẵng', ward: 'Mỹ An' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].ward).toBe('Phường Mỹ An');
  });

  it('getSchedules_ShouldThrowError_WhenMissingParameters', async () => {
    await expect(getSchedules({ city: 'Đà Nẵng' }))
      .rejects
      .toThrow('Vui lòng chọn Tỉnh/Thành phố và Phường/Xã.');
  });

  it('getSchedules_ShouldReturnEmptyArray_WhenNoMatchesFound', async () => {
    mockSnapshot([
      { id: '1', data: () => ({ city: 'Đà Nẵng', ward: 'Phường Mỹ An', neighborhood: 'Tổ 12', schedule_date: '2026-07-01T08:00:00.000Z' }) }
    ]);
    const result = await getSchedules({ city: 'Hồ Chí Minh', ward: 'Quận 1' });
    expect(result).toHaveLength(0);
  });

  it('getSchedules_ShouldFuzzyMatchLocation_WhenGivenAccentedStrings', async () => {
    mockSnapshot([
      { id: '2', data: () => ({ city: 'Thành phố Đà Nẵng', ward: 'Phường Hòa Cường Bắc', neighborhood: 'Tổ 5', schedule_date: '2026-07-02T08:00:00.000Z' }) }
    ]);
    const result = await getSchedules({ city: 'da nang', ward: 'Hoa Cuong Bac' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('getSchedules_ShouldMatchNeighborhood_WhenNeighborhoodProvided', async () => {
    mockSnapshot([
      { id: '1', data: () => ({ city: 'Đà Nẵng', ward: 'Phường Mỹ An', neighborhood: 'Tổ 12', schedule_date: '2026-07-01T08:00:00.000Z' }) },
      { id: '3', data: () => ({ city: 'Đà Nẵng', ward: 'Phường Mỹ An', neighborhood: 'Tổ 13', schedule_date: '2026-07-01T08:00:00.000Z' }) }
    ]);
    const result = await getSchedules({ city: 'Đà Nẵng', ward: 'Mỹ An', neighborhood: '12' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  // NEW TESTS FOR 100% COVERAGE

  it('getSchedules_ShouldReturnEmptyArray_WhenSnapshotIsEmpty', async () => {
    mockSnapshot([]);
    const result = await getSchedules({ city: 'Đà Nẵng', ward: 'Mỹ An' });
    expect(result).toHaveLength(0);
  });

  it('getSchedules_ShouldSortCorrectly_WhenScheduleDateIsMissing', async () => {
    // One with date, one without date
    mockSnapshot([
      { id: 'no-date', data: () => ({ city: 'Đà Nẵng', ward: 'Mỹ An', neighborhood: '', schedule_date: null }) },
      { id: 'has-date', data: () => ({ city: 'Đà Nẵng', ward: 'Mỹ An', neighborhood: '', schedule_date: '2026-07-01T08:00:00.000Z' }) }
    ]);
    const result = await getSchedules({ city: 'Đà Nẵng', ward: 'Mỹ An' });
    expect(result).toHaveLength(2);
    // The one with a date should come first because the missing date is fallback to max value
    expect(result[0].id).toBe('has-date');
    expect(result[1].id).toBe('no-date');
  });

  it('getSchedules_ShouldThrowSystemError_WhenFirestoreRejects', async () => {
    firebaseAdmin.db.collection.mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error('Firebase DB Disconnected'))
    });
    
    await expect(getSchedules({ city: 'Đà Nẵng', ward: 'Mỹ An' }))
      .rejects
      .toThrow('Lỗi hệ thống khi tải lịch thu gom. Chi tiết: Firebase DB Disconnected');
  });

});

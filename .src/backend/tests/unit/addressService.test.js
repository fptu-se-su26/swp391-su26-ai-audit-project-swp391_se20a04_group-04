const { getProvinces, getWardsByProvince } = require('../../services/addressService');

describe('Address Service Unit Tests (Real API)', () => {
  
  // Tăng thời gian timeout vì gọi API thật có thể mất thời gian
  jest.setTimeout(10000);

  it('getProvinces_ShouldReturnListOfProvinces_FromRealAPI', async () => {
    const provinces = await getProvinces();
    expect(Array.isArray(provinces)).toBe(true);
    expect(provinces.length).toBeGreaterThan(0);
    // Kiểm tra cấu trúc của object trả về
    expect(provinces[0]).toHaveProperty('code');
    expect(provinces[0]).toHaveProperty('name');
    expect(provinces[0]).toHaveProperty('codename');
  });

  it('getWardsByProvince_ShouldReturnListOfWards_ForValidProvinceCode', async () => {
    // 48 là code của Đà Nẵng (theo vn-region-api hoặc open-api)
    const wards = await getWardsByProvince('48');
    expect(Array.isArray(wards)).toBe(true);
    expect(wards.length).toBeGreaterThan(0);
    expect(wards[0]).toHaveProperty('code');
    expect(wards[0]).toHaveProperty('name');
    expect(wards[0]).toHaveProperty('districtName');
  });

  it('getWardsByProvince_ShouldReturnEmptyArray_WhenCodeIsMissing', async () => {
    const wards = await getWardsByProvince('');
    expect(wards).toEqual([]);
  });

  // Test một mã code giả để xem nó có fallback hay báo rỗng không
  it('getWardsByProvince_ShouldHandleInvalidOrEmptyCodeGracefully', async () => {
    const wards = await getWardsByProvince('9999');
    expect(Array.isArray(wards)).toBe(true);
  });

  // ĐỂ ĐẠT 100% COVERAGE CHO ADDRESS SERVICE:
  // Buộc phải dùng mock tạm thời trong 2 case lỗi dưới đây để kích hoạt nhánh fallback (dòng catch error)
  // Các case trên vẫn sử dụng API thật.
  describe('Fallback and Error Paths (Mocked)', () => {
    let originalFetch;

    beforeAll(() => {
      originalFetch = global.fetch;
    });

    afterAll(() => {
      global.fetch = originalFetch;
    });

    it('getProvinces_ShouldFallback_WhenPrimaryAPIFails', async () => {
      // Giả lập API chính lỗi, API fallback thành công
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error on primary')) // Lỗi API 1
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ code: 1, name: 'Hà Nội', division_type: 'Thành phố' }])
        }); // Thành công API 2
      
      const provinces = await getProvinces();
      expect(provinces[0].name).toBe('Hà Nội');
    });

    it('getProvinces_ShouldThrowError_WhenBothAPIsFail', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('All network down'));
      await expect(getProvinces()).rejects.toThrow('Không thể tải danh sách Tỉnh/Thành phố.');
    });

    it('getWardsByProvince_ShouldThrowError_WhenAllAPIsFail', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('All network down'));
      await expect(getWardsByProvince('48')).rejects.toThrow('Không thể tải danh sách Phường/Xã cho khu vực này.');
    });
  });

});

/**
 * Service lấy thông tin địa chính Việt Nam từ API vn-region-api của huynhminhvangit
 * Kết hợp Fallback thông minh sang provinces.open-api.vn để đảm bảo hỗ trợ đầy đủ 63 tỉnh thành (bao gồm cả Đà Nẵng).
 */

/**
 * Lấy danh sách Tỉnh/Thành phố
 * @returns {Promise<Array>} Danh sách Tỉnh/Thành
 */
async function getProvinces() {
  try {
    const url = 'https://huynhminhvangit.github.io/vn-region-api/data/provinces.json';
    console.log(`[addressService] Đang tải danh sách Tỉnh/Thành từ: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const provinces = await response.json();
    
    // Ánh xạ cấu trúc dữ liệu và sắp xếp theo tiếng Việt
    return provinces.map(p => ({
      code: p.code,
      name: p.name,
      codename: p.codename || p.name.toLowerCase().replace(/ /g, '_'),
      division_type: p.type || 'Tỉnh/Thành phố'
    })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } catch (error) {
    console.error('[addressService] Lỗi khi lấy danh sách tỉnh thành từ vn-region-api:', error);
    
    // Hỗ trợ Fallback lấy danh sách tỉnh thành đầy đủ nếu API chính gặp sự cố
    try {
      console.log('[addressService] Tải danh sách tỉnh thành dự phòng từ open-api.vn');
      const response = await fetch('https://provinces.open-api.vn/api/p/');
      if (response.ok) {
        const provinces = await response.json();
        return provinces.map(p => ({
          code: p.code.toString(),
          name: p.name,
          codename: p.codename,
          division_type: p.division_type
        })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      }
    } catch (e) {
      console.error('[addressService] Lỗi khi lấy danh sách tỉnh thành dự phòng:', e);
    }
    throw new Error('Không thể tải danh sách Tỉnh/Thành phố.');
  }
}

/**
 * Lấy danh sách Phường/Xã của một Tỉnh/Thành phố dựa trên mã Tỉnh/Thành
 * @param {string|number} provinceCode Mã tỉnh/thành (Ví dụ: "01", "48")
 * @returns {Promise<Array>} Danh sách Phường/Xã
 */
async function getWardsByProvince(provinceCode) {
  if (!provinceCode) {
    return [];
  }
  
  // Đảm bảo mã tỉnh thành có dạng 2 chữ số (ví dụ: "1" thành "01")
  let formattedCode = provinceCode.toString().trim();
  if (formattedCode.length === 1) {
    formattedCode = '0' + formattedCode;
  }

  console.log(`[addressService] Đang tìm kiếm Phường/Xã cho tỉnh code: ${formattedCode}`);

  try {
    let wards = [];
    const openApiCode = parseInt(formattedCode, 10);

    // 1. Lấy dữ liệu CHÍNH từ provinces.open-api.vn (Vì đây là API thật có đầy đủ 63 tỉnh thành)
    try {
      const openApiRes = await fetch(`https://provinces.open-api.vn/api/p/${openApiCode}?depth=3`);
      if (openApiRes.ok) {
        const data = await openApiRes.json();
        if (data.districts && Array.isArray(data.districts)) {
          for (const district of data.districts) {
            if (district.wards && Array.isArray(district.wards)) {
              for (const ward of district.wards) {
                wards.push({
                  code: ward.code.toString(),
                  name: ward.name,
                  district_name: district.name
                });
              }
            }
          }
        }
      }
    } catch (openApiErr) {
      console.warn(`[addressService] open-api.vn lỗi: ${openApiErr.message}. Chuyển sang dự phòng...`);
    }

    // 2. PHƯƠNG ÁN DỰ PHÒNG (FALLBACK): Nếu API chính sập, gọi API tĩnh
    if (wards.length === 0) {
      console.log(`[addressService] Kích hoạt Fallback sang huynhminhvangit...`);
      const fallbackRes = await fetch('https://huynhminhvangit.github.io/vn-region-api/data/wards.json');
      if (fallbackRes.ok) {
        const allWards = await fallbackRes.json();
        const filtered = allWards.filter(w => w.province_code === formattedCode);
        filtered.forEach(w => wards.push({ code: w.code, name: w.name, district_name: 'Quận/Huyện' }));
      }
    }

    // Ánh xạ dữ liệu trả về cho frontend
    return wards.map(w => ({
      code: w.code,
      name: w.name,
      codename: w.codename || w.name.toLowerCase().replace(/ /g, '_'),
      districtName: w.district_name || w.districtName || 'Quận/Huyện'
    })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  } catch (error) {
    console.error(`[addressService] Lỗi tổng thể khi lấy danh sách phường xã cho tỉnh ${formattedCode}:`, error);
    throw new Error('Không thể tải danh sách Phường/Xã cho khu vực này.');
  }
}

module.exports = {
  getProvinces,
  getWardsByProvince
};

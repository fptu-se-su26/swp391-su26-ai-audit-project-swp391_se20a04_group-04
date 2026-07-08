/**
 * Service lấy thông tin địa chính Việt Nam
 * Ưu tiên gọi trực tiếp API để đảm bảo dữ liệu mới nhất (theo yêu cầu người dùng)
 */

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[addressService] Lỗi gọi API ${url} (Lần ${i + 1}/${retries}): ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

/**
 * Lấy danh sách Tỉnh/Thành phố
 * @returns {Promise<Array>} Danh sách Tỉnh/Thành
 */
async function getProvinces() {
  try {
    const url = 'https://provinces.open-api.vn/api/p/';
    console.log(`[addressService] Đang tải danh sách Tỉnh/Thành từ API: ${url}`);
    
    const provinces = await fetchWithRetry(url);
    
    return provinces.map(p => ({
      code: p.code.toString(),
      name: p.name,
      codename: p.codename || p.name.toLowerCase().replace(/ /g, '_'),
      division_type: p.division_type || 'Tỉnh/Thành phố'
    })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } catch (error) {
    console.error('[addressService] Lỗi khi lấy danh sách tỉnh thành từ API:', error);
    throw new Error('Không thể tải danh sách Tỉnh/Thành phố do lỗi API.');
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
  
  const openApiCode = parseInt(provinceCode.toString().trim(), 10);
  console.log(`[addressService] Đang tìm kiếm Phường/Xã cho tỉnh code: ${openApiCode} từ API`);

  try {
    let wards = [];
    const url = `https://provinces.open-api.vn/api/p/${openApiCode}?depth=3`;
    
    // Gọi API lấy toàn bộ thông tin Tỉnh bao gồm Huyện và Xã, thử lại 3 lần nếu mạng chập chờn
    const data = await fetchWithRetry(url, 3);
    
    if (data.districts && Array.isArray(data.districts)) {
      for (const district of data.districts) {
        if (district.wards && Array.isArray(district.wards)) {
          for (const ward of district.wards) {
            wards.push({
              code: ward.code.toString(),
              name: ward.name,
              codename: ward.codename || ward.name.toLowerCase().replace(/ /g, '_'),
              districtName: district.name || 'Quận/Huyện'
            });
          }
        }
      }
    }

    return wards.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  } catch (error) {
    console.error(`[addressService] Lỗi tổng thể khi gọi API cho tỉnh ${openApiCode}:`, error);
    throw new Error('Không thể tải danh sách Phường/Xã từ API cho khu vực này.');
  }
}

module.exports = {
  getProvinces,
  getWardsByProvince
};

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

    // 1. Thử lấy từ API tùy chỉnh của huynhminhvangit trước
    const apiUrl = `https://huynhminhvangit.github.io/vn-region-api/api/wards.html?province_code=${formattedCode}`;
    const response = await fetch(apiUrl);
    
    if (response.ok) {
      const htmlContent = await response.text();
      const match = htmlContent.match(/<pre>(.*?)<\/pre>/s);
      if (match) {
        try {
          wards = JSON.parse(match[1]);
        } catch (e) {
          console.warn('[addressService] Phân tích regex thất bại, chuyển hướng xử lý...');
        }
      }

      // Nếu regex rỗng, thử lấy từ file JSON của huynhminhvangit
      if (wards.length === 0) {
        const fallbackRes = await fetch('https://huynhminhvangit.github.io/vn-region-api/data/wards.json');
        if (fallbackRes.ok) {
          const allWards = await fallbackRes.json();
          wards = allWards.filter(w => w.province_code === formattedCode);
        }
      }
    }

    // 2. PHƯƠNG ÁN DỰ PHÒNG HOÀN HẢO (FALLBACK):
    // Vì API tùy chỉnh chỉ chứa dữ liệu mẫu (ví dụ: chỉ có Phường Phúc Xá ở Hà Nội),
    // nên nếu wards trả về rỗng (như Đà Nẵng code 48, HCM code 79, v.v.),
    // ta tự động chuyển sang tải đầy đủ Phường/Xã từ provinces.open-api.vn!
    if (wards.length === 0) {
      console.log(`[addressService] Cảnh báo: API tùy chỉnh không có dữ liệu cho Tỉnh code ${formattedCode}. Đang tự động kích hoạt Fallback sang open-api.vn...`);
      
      const openApiCode = parseInt(formattedCode, 10);
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
    
    // Nếu có lỗi hệ thống, kích hoạt ngay fallback trực tiếp để tránh gián đoạn trải nghiệm
    try {
      const openApiCode = parseInt(formattedCode, 10);
      const openApiRes = await fetch(`https://provinces.open-api.vn/api/p/${openApiCode}?depth=3`);
      if (openApiRes.ok) {
        const data = await openApiRes.json();
        const fallbackWards = [];
        if (data.districts && Array.isArray(data.districts)) {
          for (const district of data.districts) {
            if (district.wards && Array.isArray(district.wards)) {
              for (const ward of district.wards) {
                fallbackWards.push({
                  code: ward.code.toString(),
                  name: ward.name,
                  districtName: district.name
                });
              }
            }
          }
        }
        return fallbackWards.map(w => ({
          code: w.code,
          name: w.name,
          codename: w.name.toLowerCase().replace(/ /g, '_'),
          districtName: w.districtName
        })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      }
    } catch (fallbackErr) {
      console.error('[addressService] Nghiêm trọng: Cả API chính và dự phòng đều thất bại:', fallbackErr);
    }
    
    throw new Error('Không thể tải danh sách Phường/Xã cho khu vực này.');
  }
}

module.exports = {
  getProvinces,
  getWardsByProvince
};

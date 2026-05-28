/**
 * Service quản lý lịch thu gom rác từ Firestore Database
 * Sử dụng Firebase Admin SDK
 */
const { db } = require('../firebaseAdmin');

/**
 * Chuẩn hóa chuỗi để so sánh fuzzy (bỏ dấu, viết thường, bỏ ký tự đặc biệt)
 * Giúp khớp "Thành phố Đà Nẵng" với "Đà Nẵng" hay "Da Nang"
 */
function normalizeStr(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '') // Chỉ giữ chữ cái, số, khoảng trắng
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Kiểm tra xem 2 chuỗi địa danh có khớp nhau không (fuzzy)
 * "Thành phố Đà Nẵng" khớp với "Đà Nẵng" và ngược lại
 */
function locationMatch(storedName, queryName) {
  const stored = normalizeStr(storedName);
  const query = normalizeStr(queryName);
  return stored === query || stored.includes(query) || query.includes(stored);
}

/**
 * Tra cứu lịch thu gom theo địa chỉ khu vực
 * @param {Object} params Tham số tra cứu
 * @param {string} params.city Tỉnh/Thành phố
 * @param {string} params.ward Phường/Xã
 * @param {string} [params.neighborhood] Tổ dân cư (không bắt buộc)
 * @returns {Promise<Array>} Danh sách lịch thu gom khớp yêu cầu
 */
async function getSchedules({ city, ward, neighborhood }) {
  if (!city || !ward) {
    throw new Error('Vui lòng chọn Tỉnh/Thành phố và Phường/Xã.');
  }

  const neighTrimmed = (neighborhood || '').trim();

  try {
    console.log(`[scheduleService] Truy vấn: Tỉnh/Thành="${city}", Phường/Xã="${ward}", Tổ="${neighTrimmed || '(Tất cả)'}"`);

    // Lấy TOÀN BỘ lịch từ Firestore rồi lọc phía server
    // Lý do: Tên tỉnh/phường từ API địa chính có thể khác với tên lưu trong DB
    // Ví dụ: API trả "Đà Nẵng" nhưng DB lưu "Thành phố Đà Nẵng"
    const schedulesRef = db.collection('collection_schedules');
    const snapshot = await schedulesRef.get();

    if (snapshot.empty) {
      console.log('[scheduleService] Collection collection_schedules rỗng, chưa có dữ liệu.');
      return [];
    }

    let schedules = [];
    snapshot.forEach(doc => {
      schedules.push({ id: doc.id, ...doc.data() });
    });

    console.log(`[scheduleService] Tổng số lịch trong DB: ${schedules.length}`);

    // Bước 1: Lọc theo Tỉnh/Thành phố (fuzzy match)
    schedules = schedules.filter(s => locationMatch(s.city, city));
    console.log(`[scheduleService] Sau khi lọc theo city "${city}": ${schedules.length} lịch`);

    // Bước 2: Lọc theo Phường/Xã (fuzzy match)
    schedules = schedules.filter(s => locationMatch(s.ward, ward));
    console.log(`[scheduleService] Sau khi lọc theo ward "${ward}": ${schedules.length} lịch`);

    // Bước 3: Lọc theo Tổ dân cư NẾU người dùng có nhập
    // Nếu để trống → trả về TOÀN BỘ lịch của phường đó
    if (neighTrimmed !== '') {
      const searchKey = neighTrimmed.toLowerCase();
      schedules = schedules.filter(s => {
        // Bản ghi không có tổ → vẫn hiện (áp dụng cho toàn phường)
        if (!s.neighborhood || s.neighborhood.toString().trim() === '') return true;
        const sNeigh = normalizeStr(s.neighborhood.toString());
        const sKey = normalizeStr(searchKey);
        // Khớp nếu tổ chứa từ khóa hoặc từ khóa chứa tổ (ví dụ: "12" khớp "Tổ 12")
        return sNeigh.includes(sKey) || sKey.includes(sNeigh);
      });
      console.log(`[scheduleService] Sau khi lọc theo neighborhood "${neighTrimmed}": ${schedules.length} lịch`);
    } else {
      console.log(`[scheduleService] Không lọc theo neighborhood → hiển thị toàn bộ ${schedules.length} lịch của phường.`);
    }

    // Sắp xếp lịch thu gom theo ngày tăng dần (Lịch gần nhất lên trước)
    schedules.sort((a, b) => {
      const dateA = a.schedule_date ? new Date(a.schedule_date) : new Date(8640000000000000);
      const dateB = b.schedule_date ? new Date(b.schedule_date) : new Date(8640000000000000);
      return dateA - dateB;
    });

    console.log(`[scheduleService] Trả về ${schedules.length} lịch.`);
    return schedules;
  } catch (error) {
    console.error('[scheduleService] Lỗi khi lấy lịch từ Firestore:', error);
    throw new Error('Lỗi hệ thống khi tải lịch thu gom. Vui lòng thử lại sau.');
  }
}

module.exports = {
  getSchedules
};

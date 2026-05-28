/**
 * Service quản lý lịch thu gom rác từ Firestore Database
 * Sử dụng Firebase Admin SDK
 */
const { db } = require('../firebaseAdmin');

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

  try {
    console.log(`[scheduleService] Đang truy vấn lịch: Tỉnh/Thành="${city}", Phường/Xã="${ward}", Tổ="${neighborhood || 'Tất cả'}"`);

    // Tạo query Firestore cơ bản lọc theo Tỉnh/Thành và Phường/Xã
    const schedulesRef = db.collection('collection_schedules');
    const snapshot = await schedulesRef
      .where('city', '==', city)
      .where('ward', '==', ward)
      .get();

    if (snapshot.empty) {
      console.log('[scheduleService] Không tìm thấy lịch nào khớp với Tỉnh/Thành và Phường/Xã đã chọn.');
      return [];
    }

    let schedules = [];
    snapshot.forEach(doc => {
      schedules.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Lọc linh hoạt theo Tổ dân cư nếu có cung cấp 
    if (neighborhood && neighborhood.trim() !== '') {
      const searchKey = neighborhood.trim().toLowerCase();
      schedules = schedules.filter(s => {
        if (!s.neighborhood) return false;
        const sNeigh = s.neighborhood.toString().toLowerCase();

        // Kiểm tra xem có chứa từ khóa không (Ví dụ: "12" khớp với "Tổ 12", "Tổ dân cư 12")
        return sNeigh.includes(searchKey) || searchKey.includes(sNeigh);
      });
    }

    // Sắp xếp lịch thu gom theo ngày tăng dần (Lịch gần nhất lên trước)
    schedules.sort((a, b) => {
      const dateA = a.schedule_date ? new Date(a.schedule_date) : new Date(8640000000000000);
      const dateB = b.schedule_date ? new Date(b.schedule_date) : new Date(8640000000000000);
      return dateA - dateB;
    });

    return schedules;
  } catch (error) {
    console.error('[scheduleService] Lỗi khi lấy lịch từ Firestore:', error);
    throw new Error('Lỗi hệ thống khi tải lịch thu gom. Vui lòng thử lại sau.');
  }
}

module.exports = {
  getSchedules
};

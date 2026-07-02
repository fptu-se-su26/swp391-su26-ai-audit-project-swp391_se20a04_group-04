const { db } = require('../config/firebase');
const { normalizeUser, normalizeStr } = require('../helpers/normalizeUser');

const USERS_COLLECTION = 'users';

/**
 * GET /api/resident/upcoming-schedules
 * Lấy lịch thu gom sắp tới cho cư dân dựa trên khu vực đã đăng ký.
 */
async function getUpcomingSchedules(req, res) {
  try {
    // Lấy thông tin user để lấy khu vực đã đăng ký
    const userDoc = await db.collection(USERS_COLLECTION).doc(req.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin người dùng.' });
    }

    const userData = normalizeUser(userDoc.data(), req.uid);
    const userArea = userData.area || '';

    if (!userArea) {
      return res.status(200).json([]);
    }

    // Lấy tất cả lịch thu gom
    const snapshot = await db.collection('collection_schedules').get();
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const now = new Date();
    let schedules = [];
    snapshot.forEach(doc => {
      schedules.push({ id: doc.id, ...doc.data() });
    });

    // Lọc lịch theo khu vực user (fuzzy match với city hoặc ward)
    const normalizedArea = normalizeStr(userArea);

    schedules = schedules.filter(s => {
      const normalizedCity = normalizeStr(s.city);
      const normalizedWard = normalizeStr(s.ward);
      // Khớp nếu city hoặc ward nằm trong area hoặc ngược lại
      return normalizedArea.includes(normalizedCity) || normalizedCity.includes(normalizedArea) ||
             normalizedArea.includes(normalizedWard) || normalizedWard.includes(normalizedArea);
    });

    // Chỉ lấy lịch sắp tới (ngày >= hôm nay)
    const todayStr = now.toISOString().slice(0, 10);
    schedules = schedules.filter(s => {
      if (!s.schedule_date) return false;
      const schedDate = new Date(s.schedule_date).toISOString().slice(0, 10);
      return schedDate >= todayStr;
    });

    // Sắp xếp theo ngày tăng dần
    schedules.sort((a, b) => {
      const dateA = new Date(a.schedule_date);
      const dateB = new Date(b.schedule_date);
      return dateA - dateB;
    });

    // Chỉ trả về thông tin cần thiết: ngày, giờ, loại rác
    const result = schedules.map(s => ({
      id: s.id,
      schedule_date: s.schedule_date,
      service_type: s.service_type || '',
      route_name: s.route_name || '',
      city: s.city || '',
      ward: s.ward || '',
      neighborhood: s.neighborhood || '',
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('[API] Lỗi lấy lịch thu gom cho cư dân:', error.message);
    return res.status(500).json({ error: 'Không thể tải lịch thu gom khu vực của bạn.' });
  }
}

module.exports = { getUpcomingSchedules };

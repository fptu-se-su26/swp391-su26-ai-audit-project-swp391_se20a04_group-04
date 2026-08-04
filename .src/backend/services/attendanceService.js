const { db } = require('../config/firebase');

const ATTENDANCE_COLLECTION = 'attendances';
const USERS_COLLECTION = 'users';

function getTodayDateKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calculateWorkHours(checkInIso, checkOutIso) {
  if (!checkInIso || !checkOutIso) return 0;
  const start = new Date(checkInIso);
  const end = new Date(checkOutIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffMs = Math.max(0, end.getTime() - start.getTime());
  return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
}

const attendanceService = {
  /**
   * Lấy điểm danh hôm nay của Collector
   */
  async getTodayAttendance(collectorId) {
    const todayKey = getTodayDateKey();
    const snap = await db.collection(ATTENDANCE_COLLECTION)
      .where('collector_id', '==', collectorId)
      .where('date', '==', todayKey)
      .get();

    if (snap.empty) {
      return {
        date: todayKey,
        status: 'not_checked_in',
        check_in: null,
        check_out: null,
        work_hours: 0,
      };
    }

    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  /**
   * Collector Bấm Bắt đầu ca (Check-in)
   */
  async checkIn(collectorId, collectorName, payload = {}) {
    const todayKey = getTodayDateKey();
    const nowIso = new Date().toISOString();

    const snap = await db.collection(ATTENDANCE_COLLECTION)
      .where('collector_id', '==', collectorId)
      .where('date', '==', todayKey)
      .get();

    if (!snap.empty) {
      const existingDoc = snap.docs[0];
      const data = existingDoc.data();
      if (data.check_in) {
        const err = new Error(`Bạn đã điểm danh vào ca hôm nay lúc ${new Date(data.check_in).toLocaleTimeString('vi-VN')}.`);
        err.status = 400;
        throw err;
      }
    }

    const docRef = db.collection(ATTENDANCE_COLLECTION).doc();
    const newRecord = {
      attendance_id: docRef.id,
      collector_id: collectorId,
      collector_name: collectorName || 'Nhân viên thu gom',
      date: todayKey,
      check_in: nowIso,
      check_out: null,
      status: 'in_shift',
      work_hours: 0,
      location_check_in: payload.location || null,
      note: payload.note || '',
      created_at: nowIso,
      updated_at: nowIso,
    };

    await docRef.set(newRecord);
    return { id: docRef.id, ...newRecord };
  },

  /**
   * Collector Bấm Kết thúc ca (Check-out)
   */
  async checkOut(collectorId, collectorName, payload = {}) {
    const todayKey = getTodayDateKey();
    const nowIso = new Date().toISOString();

    const snap = await db.collection(ATTENDANCE_COLLECTION)
      .where('collector_id', '==', collectorId)
      .where('date', '==', todayKey)
      .get();

    if (snap.empty) {
      const err = new Error('Bạn chưa điểm danh vào ca hôm nay.');
      err.status = 400;
      throw err;
    }

    const doc = snap.docs[0];
    const data = doc.data();

    if (!data.check_in) {
      const err = new Error('Không tìm thấy thời gian vào ca.');
      err.status = 400;
      throw err;
    }

    if (data.check_out) {
      const err = new Error(`Bạn đã điểm danh ra ca hôm nay lúc ${new Date(data.check_out).toLocaleTimeString('vi-VN')}.`);
      err.status = 400;
      throw err;
    }

    const hours = calculateWorkHours(data.check_in, nowIso);
    const updates = {
      check_out: nowIso,
      status: 'completed',
      work_hours: hours,
      location_check_out: payload.location || null,
      updated_at: nowIso,
    };

    await db.collection(ATTENDANCE_COLLECTION).doc(doc.id).update(updates);
    return { id: doc.id, ...data, ...updates };
  },

  /**
   * Lịch sử điểm danh trong tháng của Collector
   */
  async getCollectorAttendanceHistory(collectorId, month, year) {
    const targetMonth = Number(month) || (new Date().getMonth() + 1);
    const targetYear = Number(year) || new Date().getFullYear();

    const prefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    const snap = await db.collection(ATTENDANCE_COLLECTION)
      .where('collector_id', '==', collectorId)
      .get();

    const records = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.date && data.date.startsWith(prefix)) {
        records.push({ id: d.id, ...data });
      }
    });

    records.sort((a, b) => b.date.localeCompare(a.date));
    return records;
  },

  /**
   * Báo cáo điểm danh cho Manager (theo ngày hoặc tháng)
   */
  async getManagerAttendanceSummary(dateStr, month, year) {
    const todayKey = dateStr || getTodayDateKey();

    // 1. Lấy tất cả collector (bao gồm cả role legacy)
    const collectorsSnap = await db.collection(USERS_COLLECTION)
      .where('role', 'in', ['collector', 'Garbage Collector', 'GarbageCollector'])
      .get();

    const allCollectors = [];
    collectorsSnap.forEach(d => {
      const data = d.data();
      allCollectors.push({
        uid: d.id,
        fullName: data.fullName || data.name || 'Nhân viên',
        email: data.email || '',
        phone: data.phone || '',
      });
    });

    // 2. Lấy điểm danh hôm nay
    const todaySnap = await db.collection(ATTENDANCE_COLLECTION)
      .where('date', '==', todayKey)
      .get();

    const todayMap = {};
    todaySnap.forEach(d => {
      const data = d.data();
      todayMap[data.collector_id] = { id: d.id, ...data };
    });

    const dailySummary = allCollectors.map(col => {
      const att = todayMap[col.uid];
      return {
        collector_id: col.uid,
        collector_name: col.fullName,
        phone: col.phone,
        status: att ? att.status : 'absent',
        check_in: att?.check_in || null,
        check_out: att?.check_out || null,
        work_hours: att?.work_hours || 0,
      };
    });

    // 3. Lấy tổng quan tháng
    const targetMonth = Number(month) || (new Date().getMonth() + 1);
    const targetYear = Number(year) || new Date().getFullYear();
    const prefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

    const monthSnap = await db.collection(ATTENDANCE_COLLECTION).get();
    const monthMap = {};
    monthSnap.forEach(d => {
      const data = d.data();
      if (data.date && data.date.startsWith(prefix)) {
        if (!monthMap[data.collector_id]) monthMap[data.collector_id] = [];
        monthMap[data.collector_id].push(data);
      }
    });

    const monthlyTimesheet = allCollectors.map(col => {
      const list = monthMap[col.uid] || [];
      const totalDays = list.filter(r => r.status === 'completed' || r.status === 'in_shift').length;
      const totalHours = list.reduce((sum, r) => sum + (Number(r.work_hours) || 0), 0);
      return {
        collector_id: col.uid,
        collector_name: col.fullName,
        totalDays,
        totalHours: Number(totalHours.toFixed(1)),
        records: list,
      };
    });

    return {
      date: todayKey,
      month: targetMonth,
      year: targetYear,
      stats: {
        totalCollectors: allCollectors.length,
        inShift: dailySummary.filter(d => d.status === 'in_shift').length,
        completedToday: dailySummary.filter(d => d.status === 'completed').length,
        notCheckedIn: dailySummary.filter(d => d.status === 'absent').length,
      },
      dailySummary,
      monthlyTimesheet,
    };
  }
};

module.exports = attendanceService;

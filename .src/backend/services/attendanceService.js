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
      is_suspicious: false,
      suspicious_reason: null,
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

    // Kiểm tra nghi ngờ treo máy / không hoàn thành công việc
    let is_suspicious = false;
    let suspicious_reason = null;

    try {
      // Lấy tất cả lịch thu gom hôm nay
      const schedSnap = await db.collection('collection_schedules')
        .where('schedule_date', '==', todayKey)
        .get();

      const collectorSchedules = [];
      schedSnap.forEach(d => {
        const s = d.data();
        const candidates = [
          s.assigned_collector,
          s.collector_id,
          s.collectorId,
        ].filter(Boolean);

        let isMatch = candidates.some(v => v === collectorId || (collectorName && v === collectorName));
        if (!isMatch && s.assigned_collectors && Array.isArray(s.assigned_collectors)) {
          isMatch = s.assigned_collectors.some(c => c.id === collectorId || c.name === collectorName);
        }
        if (isMatch) {
          collectorSchedules.push(s);
        }
      });

      if (collectorSchedules.length > 0) {
        // Điều kiện 1: Vào ca trên 2 tiếng mà không chấp nhận (xác nhận) chạy bất kỳ lịch trình nào
        const hasAccepted = collectorSchedules.some(s => s.collector_confirmed === true || ['confirmed', 'in_progress', 'completed_pending_approval', 'completed'].includes((s.status || '').toLowerCase()));
        if (hours >= 2 && !hasAccepted) {
          is_suspicious = true;
          suspicious_reason = "Vào ca hơn 2 tiếng nhưng không chấp nhận chạy bất kỳ lịch trình nào.";
        }

        // Điều kiện 2: Đã chấp nhận lịch trình nhưng chưa hoàn thành mà đã bấm checkout
        if (!is_suspicious) {
          const hasUnfinished = collectorSchedules.some(s => {
            const statusLower = (s.status || '').toLowerCase();
            const isAccepted = s.collector_confirmed === true || ['confirmed', 'in_progress'].includes(statusLower);
            const isCompleted = ['completed', 'completed_pending_approval'].includes(statusLower);
            return isAccepted && !isCompleted;
          });

          if (hasUnfinished) {
            is_suspicious = true;
            suspicious_reason = "Có lịch trình đã xác nhận chạy nhưng chưa hoàn thành khi bấm kết thúc ca.";
          }
        }
      }
    } catch (schedError) {
      console.error('[Attendance] Lỗi kiểm tra lịch trình để cảnh báo treo máy:', schedError.message);
    }

    const updates = {
      check_out: nowIso,
      status: 'completed',
      work_hours: hours,
      location_check_out: payload.location || null,
      updated_at: nowIso,
      is_suspicious,
      suspicious_reason,
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
        is_suspicious: att?.is_suspicious || false,
        suspicious_reason: att?.suspicious_reason || null,
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
  },

  /**
   * Động cơ tính lương tự động cho Collector dựa trên Chấm công & Số tuyến hoàn thành
   * Phương hướng 1: (Số giờ làm * 40.000) + (Số tuyến hoàn thành * 50.000) + Phụ cấp độc hại (500.000)
   */
  async calculateCollectorSalaryDetails(collectorId, month, year) {
    const HOURLY_RATE = 40000;
    const ROUTE_BONUS_RATE = 50000;
    const HAZARD_ALLOWANCE = 500000;

    const targetMonth = Number(month) || (new Date().getMonth() + 1);
    const targetYear = Number(year) || new Date().getFullYear();
    const monthStr = String(targetMonth).padStart(2, '0');
    const yearStr = String(targetYear);
    const prefix = `${yearStr}-${monthStr}`;

    // 1. Lấy dữ liệu điểm danh trong tháng
    const attendSnap = await db.collection(ATTENDANCE_COLLECTION)
      .where('collector_id', '==', collectorId)
      .get();

    let totalHours = 0;
    const daysWorkedSet = new Set();

    attendSnap.forEach((doc) => {
      const data = doc.data();
      const dateVal = data.date || '';
      if (dateVal.startsWith(prefix)) {
        if (data.work_hours) {
          totalHours += Number(data.work_hours) || 0;
        }
        daysWorkedSet.add(dateVal);
      }
    });

    totalHours = Math.round(totalHours * 10) / 10;
    const daysWorked = daysWorkedSet.size;

    // 2. Lấy dữ liệu tuyến rác đã hoàn thành trong tháng
    const schedSnap = await db.collection('collection_schedules').get();
    let completedRoutes = 0;

    schedSnap.forEach((doc) => {
      const data = doc.data();
      const status = (data.status || '').toLowerCase();
      if (status !== 'completed' && status !== 'completed_pending_approval') return;
      const dateVal = (data.schedule_date || '').slice(0, 7);
      if (dateVal !== prefix) return;

      const isAssigned =
        data.collector_id === collectorId ||
        data.assigned_collector === collectorId ||
        (Array.isArray(data.assigned_collectors) &&
          data.assigned_collectors.some((c) => (typeof c === 'string' ? c === collectorId : c.id === collectorId)));

      if (isAssigned) {
        completedRoutes++;
      }
    });

    const hourlyPay = totalHours * HOURLY_RATE;
    const routePay = completedRoutes * ROUTE_BONUS_RATE;
    const allowance = daysWorked > 0 ? HAZARD_ALLOWANCE : 0;
    const calculatedBaseSalary = hourlyPay + routePay + allowance;

    return {
      collectorId,
      month: targetMonth,
      year: targetYear,
      totalHours,
      daysWorked,
      completedRoutes,
      hourlyRate: HOURLY_RATE,
      routeBonusRate: ROUTE_BONUS_RATE,
      hazardAllowance: allowance,
      hourlyPay,
      routePay,
      calculatedBaseSalary,
    };
  },
};

module.exports = attendanceService;

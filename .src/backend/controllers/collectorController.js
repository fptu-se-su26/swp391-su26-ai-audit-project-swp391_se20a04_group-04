const { db } = require('../config/firebase');
const collectorService = require('../services/collectorService');
const attendanceService = require('../services/attendanceService');

/**
 * GET /api/dashboard/collector
 */
async function getDashboard(req, res) {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const data = await collectorService.getDashboardSummary(
      req.uid,
      req.userProfile.fullName,
      date,
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[API] Lỗi dashboard collector:', error.message);
    return res.status(500).json({ error: 'Không thể tải dashboard collector.' });
  }
}

/**
 * GET /api/collector/schedules
 */
async function getSchedules(req, res) {
  try {
    if (req.query.all === 'true') {
      const result = await collectorService.getAllSchedules(
        req.uid,
        req.userProfile.fullName,
      );
      return res.status(200).json({ success: true, data: result });
    }

    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const result = await collectorService.getDailySchedules(
      req.uid,
      req.userProfile.fullName,
      date,
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[API] Lỗi lấy lịch collector:', error.message);
    return res.status(500).json({ error: 'Không thể tải lịch làm việc.' });
  }
}

/**
 * GET /api/route-assignments/my
 */
async function getMyAssignments(req, res) {
  try {
    const from = req.query.from || req.query.date || new Date().toISOString().slice(0, 10);
    const to = req.query.to || from;
    const data = await collectorService.getAssignmentsInRange(req.uid, from, to);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[API] Lỗi lấy route assignments:', error.message);
    return res.status(500).json({ error: 'Không thể tải tuyến được gán.' });
  }
}

/**
 * PATCH /api/collector/schedules/:sourceType/:id/status
 */
async function updateScheduleStatus(req, res) {
  const { sourceType, id } = req.params;
  const { action, imageUrls, incidentType, description } = req.body;

  try {
    const result = await collectorService.updateItemStatus(req.uid, req.userProfile.fullName, {
      sourceType,
      id,
      action,
      imageUrls,
      incidentType,
      description,
    });
    return res.status(200).json({
      success: true,
      message: action === 'complete'
        ? 'Đã gửi hoàn thành tuyến. Chờ Manager xác nhận.'
        : 'Cập nhật trạng thái thành công.',
      data: result,
    });
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error('[API] Lỗi cập nhật trạng thái collector:', error.message);
    }
    return res.status(status).json({ error: error.message || 'Không thể cập nhật trạng thái.' });
  }
}

/**
 * PATCH /api/route-assignments/:assignmentId/status
 */
async function updateAssignmentStatus(req, res) {
  const { assignmentId } = req.params;
  const statusMap = {
    in_progress: 'start',
    completed: 'complete',
    delayed: 'incident',
  };
  const action = statusMap[req.body.status] || req.body.action;

  try {
    const result = await collectorService.updateItemStatus(req.uid, req.userProfile.fullName, {
      sourceType: 'assignment',
      id: assignmentId,
      action,
      imageUrls: req.body.imageUrls,
      incidentType: req.body.incidentType,
      description: req.body.description || req.body.message,
    });
    return res.status(200).json({ success: true, message: 'Assignment status updated successfully', data: result });
  } catch (error) {
    const httpStatus = error.status || 500;
    return res.status(httpStatus).json({ error: error.message || 'Không thể cập nhật trạng thái tuyến.' });
  }
}

/**
 * GET /api/collector/reports
 */
async function getReports(req, res) {
  try {
    const data = await collectorService.getAssignedReports(req.uid);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[API] Lỗi lấy phản ánh collector:', error.message);
    return res.status(500).json({ error: 'Không thể tải phản ánh được giao.' });
  }
}

/**
 * GET /api/reports/:reportId/comments
 */
async function getReportComments(req, res) {
  try {
    const data = await collectorService.getReportComments(req.params.reportId, req.uid);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Không thể tải lịch sử xử lý.' });
  }
}

/**
 * PATCH /api/reports/:reportId/status
 */
async function updateReportStatus(req, res) {
  const { status, message, imageUrls } = req.body;
  try {
    const result = await collectorService.updateReportStatus(
      req.uid,
      req.userProfile,
      req.params.reportId,
      { status, message, imageUrls },
    );
    return res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      data: result,
    });
  } catch (error) {
    const httpStatus = error.status || 500;
    if (httpStatus >= 500) {
      console.error('[API] Lỗi cập nhật phản ánh:', error.message);
    }
    return res.status(httpStatus).json({ error: error.message || 'Không thể cập nhật phản ánh.' });
  }
}

/**
 * POST /api/collector/confirm-route
 */
async function confirmRoute(req, res) {
  const { scheduleId } = req.body;
  if (!scheduleId) {
    return res.status(400).json({ error: 'Vui lòng cung cấp ID lịch để xác nhận tuyến.' });
  }

  try {
    const docRef = db.collection('collection_schedules').doc(scheduleId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Không tìm thấy lịch để xác nhận.' });
    }

    const scheduleData = snapshot.data();
    const assigned = scheduleData.assigned_collector || scheduleData.collector_id || '';
    let isOwner = assigned === req.uid || assigned === req.userProfile.fullName;

    if (!isOwner && scheduleData.assigned_collectors && Array.isArray(scheduleData.assigned_collectors)) {
      isOwner = scheduleData.assigned_collectors.some(c => c.id === req.uid || c.name === req.userProfile.fullName);
    }

    if (!isOwner) {
      return res.status(403).json({ error: 'Lịch này không được gán cho bạn.' });
    }

    await docRef.update({
      collector_confirmed: true,
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Lỗi xác nhận tuyến của nhân viên thu gom:', error.message);
    return res.status(500).json({ error: 'Không thể xác nhận tuyến. Vui lòng thử lại sau.' });
  }
}

async function getTodayAttendance(req, res) {
  try {
    const data = await attendanceService.getTodayAttendance(req.uid);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Không thể tải điểm danh.' });
  }
}

async function checkIn(req, res) {
  try {
    const data = await attendanceService.checkIn(req.uid, req.userProfile?.fullName, req.body);
    return res.status(200).json({ success: true, message: 'Điểm danh vào ca thành công!', data });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Không thể điểm danh vào ca.' });
  }
}

async function checkOut(req, res) {
  try {
    const data = await attendanceService.checkOut(req.uid, req.userProfile?.fullName, req.body);
    return res.status(200).json({ success: true, message: 'Điểm danh ra ca thành công!', data });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Không thể điểm danh ra ca.' });
  }
}

async function getAttendanceHistory(req, res) {
  try {
    const { month, year } = req.query;
    const data = await attendanceService.getCollectorAttendanceHistory(req.uid, month, year);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Không thể tải lịch sử điểm danh.' });
  }
}

module.exports = {
  getDashboard,
  getSchedules,
  getMyAssignments,
  updateScheduleStatus,
  updateAssignmentStatus,
  getReports,
  getReportComments,
  updateReportStatus,
  confirmRoute,
  confirmWeek,
  denyWeek,
  getMyTeam,
  getMySalary,
  getSalaryHistory,
  getTodayAttendance,
  checkIn,
  checkOut,
  getAttendanceHistory,
};

/**
 * GET /api/collector/my-team
 */
async function getMyTeam(req, res) {
  try {
    const teams = await collectorService.getMyTeam(req.uid);
    return res.status(200).json({ success: true, data: teams });
  } catch (error) {
    console.error('[API] Lỗi lấy thông tin đội:', error.message);
    return res.status(500).json({ error: 'Không thể tải thông tin đội nhóm.' });
  }
}

/**
 * GET /api/collector/salary?month=8&year=2026
 */
async function getMySalary(req, res) {
  try {
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const salary = await collectorService.getCollectorSalary(req.uid, month, year);
    return res.status(200).json({ success: true, data: salary });
  } catch (error) {
    console.error('[API] Lỗi lấy lương collector:', error.message);
    return res.status(500).json({ error: 'Không thể tải thông tin lương.' });
  }
}

/**
 * GET /api/collector/salary/history
 */
async function getSalaryHistory(req, res) {
  try {
    const history = await collectorService.getCollectorSalaryHistory(req.uid);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error('[API] Lỗi lấy lịch sử lương collector:', error.message);
    return res.status(500).json({ error: 'Không thể tải lịch sử lương.' });
  }
}

function isScheduleAssignedToCollector(s, collectorUid, collectorName) {
  if (s.collector_id === collectorUid || s.collectorId === collectorUid) return true;
  if (s.assigned_collector === collectorUid) return true;
  if (collectorName && s.assigned_collector && typeof s.assigned_collector === 'string' && s.assigned_collector.includes(collectorName)) return true;
  if (Array.isArray(s.assigned_collectors)) {
    return s.assigned_collectors.some(c => typeof c === 'string' ? (c === collectorUid || (collectorName && c.includes(collectorName))) : (c.id === collectorUid || c.uid === collectorUid));
  }
  return false;
}

/**
 * POST /api/collector/confirm-week
 * Body: { isoWeek: 'YYYY-WNN' }
 */
async function confirmWeek(req, res) {
  const { isoWeek } = req.body;
  if (!isoWeek) return res.status(400).json({ error: 'isoWeek là bắt buộc (định dạng YYYY-WNN).' });

  try {
    const snap = await db.collection('collection_schedules').get();

    const batch = db.batch();
    let count = 0;

    snap.forEach(doc => {
      const s = doc.data();
      if (!isScheduleAssignedToCollector(s, req.uid, req.userProfile?.fullName)) return;
      const dateStr = s.schedule_date;
      if (!dateStr) return;
      if (getISOWeekLabel(new Date(dateStr)) !== isoWeek) return;
      if (['completed_pending_approval', 'completed'].includes((s.status || '').toLowerCase())) return;
      batch.update(doc.ref, { collector_confirmed: true, updatedAt: new Date().toISOString() });
      count++;
    });

    await batch.commit();
    return res.status(200).json({ success: true, confirmed: count });
  } catch (error) {
    console.error('[Collector] Lỗi xác nhận tuần:', error.message);
    return res.status(500).json({ error: 'Không thể xác nhận lịch tuần.' });
  }
}

/**
 * POST /api/collector/deny-week
 * Body: { isoWeek: 'YYYY-WNN', reason: string }
 */
async function denyWeek(req, res) {
  const { isoWeek, reason } = req.body;
  if (!isoWeek || !reason?.trim()) {
    return res.status(400).json({ error: 'isoWeek và reason là bắt buộc.' });
  }

  try {
    const snap = await db.collection('collection_schedules').get();

    const batch = db.batch();
    let count = 0;

    snap.forEach(doc => {
      const s = doc.data();
      if (!isScheduleAssignedToCollector(s, req.uid, req.userProfile?.fullName)) return;
      const dateStr = s.schedule_date;
      if (!dateStr) return;
      if (getISOWeekLabel(new Date(dateStr)) !== isoWeek) return;
      const status = (s.status || '').toLowerCase();
      if (['completed', 'completed_pending_approval'].includes(status)) return;
      batch.update(doc.ref, {
        status: 'denied_by_collector',
        denial_reason: reason.trim(),
        denied_by: req.uid,
        deniedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      count++;
    });

    await batch.commit();
    return res.status(200).json({ success: true, denied: count });
  } catch (error) {
    console.error('[Collector] Lỗi từ chối tuần:', error.message);
    return res.status(500).json({ error: 'Không thể từ chối lịch tuần.' });
  }
}

function getISOWeekLabel(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}


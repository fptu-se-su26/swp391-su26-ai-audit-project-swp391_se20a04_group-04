const { db } = require('../config/firebase');
const collectorService = require('../services/collectorService');

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
      message: 'Cập nhật trạng thái thành công.',
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
};

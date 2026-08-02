const { db } = require('../config/firebase');
const { ROLES } = require('../constants/roles');
const { normalizeUser } = require('../helpers/normalizeUser');
const complaintService = require('../services/complaintService');
const reportService = require('../services/reportService');
const invoiceService = require('../services/invoiceService');
const scheduleCompletionService = require('../services/scheduleCompletionService');

const USERS_COLLECTION = 'users';

/**
 * GET /api/manager/collectors
 */
async function getCollectors(req, res) {
  try {
    const snapshot = await db.collection(USERS_COLLECTION).where('role', '==', ROLES.COLLECTOR).get();
    const collectors = [];
    snapshot.forEach(doc => {
      collectors.push(normalizeUser(doc.data(), doc.id));
    });
    return res.status(200).json(collectors);
  } catch (error) {
    console.error('[Manager] Lỗi lấy danh sách collector:', error);
    return res.status(500).json({ error: 'Lỗi khi tải danh sách nhân viên thu gom.' });
  }
}

/**
 * GET /api/manager/schedules
 */
async function getSchedules(req, res) {
  try {
    const snapshot = await db.collection('collection_schedules').orderBy('schedule_date', 'asc').get();
    const schedules = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.route_points && Array.isArray(data.route_points)) {
        data.route_points = data.route_points.map(p => {
          if (p && p.lat !== undefined && p.lng !== undefined) return [p.lat, p.lng];
          return p;
        });
      }
      schedules.push({ id: doc.id, ...data });
    });
    return res.status(200).json(schedules);
  } catch (error) {
    console.error('[API] Lỗi lấy lịch quản lý:', error.message);
    return res.status(500).json({ error: 'Không thể tải danh sách lịch cho Manager.' });
  }
}

/**
 * POST /api/manager/schedules
 */
async function createSchedule(req, res) {
  const {
    routeName,
    serviceType,
    date,
    time,
    city,
    ward,
    neighborhood,
    assignedTruck,
    assignedDriver,
    assignedCollector,
    assignedCollectors,
    teamId,
    notes,
    routePoints,
  } = req.body;

  if (!routeName || !serviceType || !date || !time) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin lịch thu gom (tên tuyến, dịch vụ, ngày, giờ).' });
  }

  if (routePoints && !Array.isArray(routePoints)) {
    return res.status(400).json({ error: 'routePoints phải là một mảng các điểm tọa độ.' });
  }

  try {
    const scheduleDate = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ error: 'Ngày hoặc giờ không hợp lệ.' });
    }

    const formattedPoints = (routePoints || []).map(p => {
      if (Array.isArray(p)) return { lat: p[0], lng: p[1] };
      return p;
    });

    const newSchedule = {
      route_name: routeName,
      service_type: serviceType,
      schedule_date: scheduleDate.toISOString(),
      city: city || '',
      ward: ward || '',
      neighborhood: neighborhood || '',
      assigned_truck: assignedTruck || '',
      assigned_driver: assignedDriver || '',
      assigned_collector: assignedCollector || '',
      assigned_collectors: assignedCollectors || [],
      team_id: teamId || null,
      collector_confirmed: false,
      status: assignedTruck && assignedDriver ? 'Assigned' : 'Planned',
      notes: notes || '',
      route_points: formattedPoints,
      created_by: req.userProfile.fullName || req.uid,
      created_at: new Date().toISOString(),
    };

    const docRef = await db.collection('collection_schedules').add(newSchedule);
    return res.status(201).json({ success: true, id: docRef.id, schedule: newSchedule });
  } catch (error) {
    console.error('[API] Lỗi tạo lịch thu gom mới:', error.message);
    return res.status(500).json({ error: 'Không thể tạo lịch thu gom. Vui lòng thử lại sau.' });
  }
}

/**
 * POST /api/manager/assign-route
 */
async function assignRoute(req, res) {
  const { scheduleId, assignedTruck, assignedDriver, assignedCollector } = req.body;
  if (!scheduleId || !assignedTruck || !assignedDriver) {
    return res.status(400).json({ error: 'Vui lòng cung cấp ID lịch, xe và tài xế để gán tuyến.' });
  }

  try {
    const docRef = db.collection('collection_schedules').doc(scheduleId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Không tìm thấy lịch cần gán tuyến.' });
    }

    const scheduleData = snapshot.data();
    if (scheduleData?.collector_confirmed) {
      return res.status(400).json({ error: 'Tuyến đã được nhân viên xác nhận, không thể chỉnh sửa nữa.' });
    }

    await docRef.update({
      assigned_truck: assignedTruck,
      assigned_driver: assignedDriver,
      assigned_collector: assignedCollector || '',
      status: 'Assigned',
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Lỗi gán tuyến cho lịch thu gom:', error.message);
    return res.status(500).json({ error: 'Không thể gán tuyến cho lịch. Vui lòng thử lại sau.' });
  }
}

/**
 * POST /api/manager/confirm-route
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

    await docRef.update({
      collector_confirmed: true,
      status: 'Confirmed',
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Lỗi xác nhận tuyến của nhân viên thu gom:', error.message);
    return res.status(500).json({ error: 'Không thể xác nhận tuyến. Vui lòng thử lại sau.' });
  }
}

/**
 * PUT /api/manager/schedules/:scheduleId
 */
async function updateSchedule(req, res) {
  const { scheduleId } = req.params;
  const { routePoints } = req.body;

  if (!scheduleId) {
    return res.status(400).json({ error: 'Vui lòng cung cấp ID lịch để cập nhật.' });
  }

  if (routePoints && !Array.isArray(routePoints)) {
    return res.status(400).json({ error: 'routePoints phải là một mảng các điểm tọa độ.' });
  }

  try {
    const docRef = db.collection('collection_schedules').doc(scheduleId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Không tìm thấy lịch cần cập nhật.' });
    }

    const scheduleData = snapshot.data();
    if (scheduleData?.collector_confirmed) {
      return res.status(400).json({ error: 'Tuyến đã được nhân viên xác nhận, không thể chỉnh sửa nữa.' });
    }

    await docRef.update({
      route_points: routePoints || [],
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Lỗi cập nhật tuyến cho lịch thu gom:', error.message);
    return res.status(500).json({ error: 'Không thể cập nhật tuyến cho lịch. Vui lòng thử lại sau.' });
  }
}

/**
 * DELETE /api/manager/schedules/:scheduleId
 */
async function deleteSchedule(req, res) {
  const { scheduleId } = req.params;
  if (!scheduleId) {
    return res.status(400).json({ error: 'Vui lòng cung cấp ID lịch cần xóa.' });
  }

  try {
    const docRef = db.collection('collection_schedules').doc(scheduleId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Không tìm thấy lịch thu gom cần xóa.' });
    }

    const scheduleData = snapshot.data();
    if (scheduleData?.collector_confirmed) {
      return res.status(400).json({ error: 'Không thể xóa lịch đã được nhân viên xác nhận.' });
    }

    await docRef.delete();
    console.log(`[API] Đã xóa lịch thu gom: ${scheduleId} bởi ${req.userProfile?.fullName || req.uid}`);
    return res.status(200).json({ success: true, message: 'Đã xóa lịch thu gom thành công.' });
  } catch (error) {
    console.error('[API] Lỗi xóa lịch thu gom:', error.message);
    return res.status(500).json({ error: 'Không thể xóa lịch thu gom. Vui lòng thử lại sau.' });
  }
}

/**
 * GET /api/manager/complaints
 */
async function getComplaints(req, res) {
  try {
    const complaints = await complaintService.getAllComplaints();
    return res.status(200).json(complaints);
  } catch (error) {
    console.error('[API] Lỗi lấy phản ánh:', error.message);
    return res.status(500).json({ error: 'Không thể tải danh sách phản ánh.' });
  }
}

/**
 * PATCH /api/manager/complaints/:complaintId/status
 */
async function updateComplaintStatus(req, res) {
  const { complaintId } = req.params;
  const { status, comment } = req.body;

  try {
    const result = await complaintService.updateComplaintStatus(
      complaintId,
      req.uid,
      req.userProfile?.fullName || 'Manager',
      { status, comment }
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[API] Lỗi cập nhật trạng thái phản ánh:', error.message);
    const httpStatus = error.message.includes('không hợp lệ') || error.message.includes('Vui lòng nhập') ? 400 : 500;
    return res.status(httpStatus).json({ error: error.message });
  }
}

/**
 * GET /api/manager/feedback-reports
 */
async function getFeedbackReports(req, res) {
  try {
    const status = req.query.status || null;
    const data = await reportService.listReports(status);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[API] Lỗi lấy feedback reports:', error.message);
    return res.status(500).json({ error: 'Không thể tải danh sách phản ánh môi trường.' });
  }
}

/**
 * GET /api/manager/feedback-reports/:reportId/comments
 */
async function getReportComments(req, res) {
  try {
    const data = await reportService.getReportComments(req.params.reportId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[API] Lỗi lấy comments phản ánh:', error.message);
    return res.status(500).json({ error: 'Không thể tải lịch sử xử lý.' });
  }
}

/**
 * PATCH /api/manager/feedback-reports/:reportId/approve
 */
async function approveReport(req, res) {
  try {
    const result = await reportService.approveReport(
      req.uid,
      req.userProfile?.fullName || 'Manager',
      req.params.reportId,
      req.body || {},
    );
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error('[API] Lỗi duyệt phản ánh:', error.message);
    }
    return res.status(status).json({ error: error.message || 'Không thể duyệt phản ánh.' });
  }
}

/**
 * GET /api/manager/reports
 */
async function getReports(req, res) {
  try {
    const scheduleSnapshot = await db.collection('collection_schedules').get();
    const schedules = [];
    scheduleSnapshot.forEach((doc) => schedules.push({ id: doc.id, ...doc.data() }));

    const complaintSnapshot = await db.collection('complaints').get();
    const complaints = [];
    complaintSnapshot.forEach((doc) => complaints.push({ id: doc.id, ...doc.data() }));

    const totalSchedules = schedules.length;
    const assignedRoutes = schedules.filter((item) => item.assigned_truck && item.assigned_driver).length;
    const upcomingSchedules = schedules.filter((item) => item.schedule_date && new Date(item.schedule_date) > new Date()).length;
    const openComplaints = complaints.filter((item) => item.status === 'open' || item.status === 'Open').length;
    const byServiceType = schedules.reduce((acc, item) => {
      const key = item.service_type || 'Other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const reportData = {
      generated_at: new Date().toISOString(),
      summary: {
        total_schedules: totalSchedules,
        assigned_routes: assignedRoutes,
        upcoming_schedules: upcomingSchedules,
        open_complaints: openComplaints,
      },
      by_service_type: byServiceType,
      schedules,
      complaints,
    };

    return res.status(200).json(reportData);
  } catch (error) {
    console.error('[API] Lỗi tạo báo cáo:', error.message);
    return res.status(500).json({ error: 'Không thể tải dữ liệu báo cáo.' });
  }
}

/**
 * GET /api/manager/residents/search?q=<query>
 * Search residents by fullName or email (no UID exposed)
 */
async function searchResidents(req, res) {
  try {
    const query = (req.query.q || '').trim().toLowerCase();
    if (!query || query.length < 1) {
      return res.status(200).json([]);
    }

    const snapshot = await db.collection(USERS_COLLECTION).where('role', '==', ROLES.RESIDENT).get();
    const results = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const fullName = (data.fullName || '').toLowerCase();
      const email = (data.email || '').toLowerCase();
      if (fullName.includes(query) || email.includes(query)) {
        results.push({
          uid: doc.id,
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
        });
      }
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error('[Manager] Lỗi tìm kiếm cư dân:', error.message);
    return res.status(500).json({ error: 'Không thể tìm kiếm cư dân.' });
  }
}

/**
 * GET /api/manager/residents/:userId/invoices
 * Get all invoices for a specific resident so manager can check for duplicates
 */
async function getResidentInvoices(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId là bắt buộc.' });
    }

    const snapshot = await db.collection('invoices')
      .where('userId', '==', userId)
      .get();

    const invoices = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Serialize date fields
      const dateFields = ['createdAt', 'dueDate', 'paidAt', 'updatedAt'];
      dateFields.forEach((field) => {
        if (data[field] && typeof data[field].toDate === 'function') {
          data[field] = data[field].toDate().toISOString();
        } else if (data[field] instanceof Date) {
          data[field] = data[field].toISOString();
        }
      });
      invoices.push({ id: doc.id, ...data });
    });

    return res.status(200).json(invoices);
  } catch (error) {
    console.error('[Manager] Lỗi lấy hóa đơn cư dân:', error.message);
    return res.status(500).json({ error: 'Không thể tải hóa đơn của cư dân.' });
  }
}

async function createInvoice(req, res) {
  try {
    const {
      invoiceId,
      userId,
      amount,
      billingMonth,
      billingYear,
      createdAt,
      createdBy,
      currency,
      dueDate,
      feeType,
      paidAt,
      status,
    } = req.body;

    if (!invoiceId || !userId || !amount || !currency || !dueDate || !feeType) {
      return res.status(400).json({ error: 'invoiceId, userId, amount, currency, dueDate và feeType là bắt buộc.' });
    }

    // Check for duplicate unpaid invoice for same userId + billingMonth
    const existingSnapshot = await db.collection('invoices')
      .where('userId', '==', userId)
      .where('billingMonth', '==', Number(billingMonth))
      .where('billingYear', '==', Number(billingYear))
      .where('status', '==', 'unpaid')
      .get();

    if (!existingSnapshot.empty) {
      return res.status(409).json({
        error: `Cư dân này đã có hóa đơn chưa thanh toán cho tháng ${billingMonth}/${billingYear}. Không thể tạo thêm.`,
      });
    }

    const invoice = await invoiceService.createOrUpdateInvoice({
      invoiceId,
      userId,
      amount,
      billingMonth,
      billingYear,
      createdAt,
      createdBy: createdBy || req.userProfile.fullName || req.uid,
      currency,
      dueDate,
      feeType,
      paidAt: paidAt || null,
      status: status || 'unpaid',
      updatedAt: new Date().toISOString(),
    });

    // Gửi thông báo cho cư dân về hóa đơn mới
    const dueDateFormatted = new Date(dueDate).toLocaleDateString('vi-VN');
    await db.collection('notifications').add({
      user_id: userId,
      title: 'Hóa đơn mới',
      content: `Hóa đơn phí vệ sinh môi trường tháng ${billingMonth}/${billingYear} đã được phát hành. Số tiền: ${Number(amount).toLocaleString('vi-VN')} ₫. Hạn thanh toán: ${dueDateFormatted}. Vui lòng thanh toán đúng hạn.`,
      type: 'invoice_created',
      is_read: false,
      sent_at: new Date(),
    });

    return res.status(201).json(invoice);
  } catch (error) {
    console.error('[API] Lỗi tạo hóa đơn bởi manager:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/manager/schedules/completion-pending
 */
async function getPendingCompletions(req, res) {
  try {
    const [pending, groups] = await Promise.all([
      scheduleCompletionService.listPendingCompletions(),
      scheduleCompletionService.getCompletionGroupsByDate(),
    ]);
    return res.status(200).json({
      success: true,
      data: { pending, groups },
    });
  } catch (error) {
    console.error('[API] Lỗi lấy tuyến chờ xác nhận:', error.message);
    return res.status(500).json({ error: 'Không thể tải danh sách tuyến chờ xác nhận.' });
  }
}

/**
 * PATCH /api/manager/schedules/:scheduleId/approve-completion
 */
async function approveScheduleCompletion(req, res) {
  try {
    const result = await scheduleCompletionService.approveScheduleCompletion(
      req.uid,
      req.userProfile?.fullName || 'Manager',
      req.params.scheduleId,
      req.body || {},
    );
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error('[API] Lỗi duyệt hoàn thành tuyến:', error.message);
    }
    return res.status(status).json({ error: error.message || 'Không thể xác nhận hoàn thành tuyến.' });
  }
}

/**
 * PATCH /api/manager/schedules/:scheduleId/reject-completion
 */
async function rejectScheduleCompletion(req, res) {
  try {
    const result = await scheduleCompletionService.rejectScheduleCompletion(
      req.uid,
      req.userProfile?.fullName || 'Manager',
      req.params.scheduleId,
      req.body || {},
    );
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error('[API] Lỗi từ chối hoàn thành tuyến:', error.message);
    }
    return res.status(status).json({ error: error.message || 'Không thể từ chối xác nhận tuyến.' });
  }
}

/**
 * POST /api/manager/schedules/approve-day
 */
async function approveDayCompletions(req, res) {
  try {
    const { date, message } = req.body || {};
    const result = await scheduleCompletionService.approveDayCompletions(
      req.uid,
      req.userProfile?.fullName || 'Manager',
      date,
      { message },
    );
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error('[API] Lỗi xác nhận toàn bộ ngày:', error.message);
    }
    return res.status(status).json({ error: error.message || 'Không thể xác nhận toàn bộ tuyến trong ngày.' });
  }
}

module.exports = {
  getCollectors,
  getSchedules,
  createSchedule,
  assignRoute,
  confirmRoute,
  updateSchedule,
  deleteSchedule,
  getComplaints,
  updateComplaintStatus,
  getFeedbackReports,
  getReportComments,
  approveReport,
  getReports,
  searchResidents,
  getResidentInvoices,
  createInvoice,
  getPendingCompletions,
  approveScheduleCompletion,
  rejectScheduleCompletion,
  approveDayCompletions,
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getDashboardStats,
  getInvoiceTemplates,
  createInvoiceTemplate,
  deleteInvoiceTemplate,
  getTeamPerformance,
  getCollectorSalaries,
  setCollectorSalary,
};

/**
 * GET /api/manager/routes
 */
async function getRoutes(req, res) {
  try {
    const snapshot = await db.collection('collection_routes').get();
    const routes = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.route_points && Array.isArray(data.route_points)) {
        data.route_points = data.route_points.map(p => {
          if (p && p.lat !== undefined && p.lng !== undefined) return [p.lat, p.lng];
          return p;
        });
      }
      routes.push({ id: doc.id, ...data });
    });
    return res.status(200).json(routes);
  } catch (error) {
    console.error('[API] Lỗi lấy danh sách tuyến mẫu:', error.message);
    return res.status(500).json({ error: 'Không thể tải danh sách tuyến mẫu.' });
  }
}

/**
 * POST /api/manager/routes
 */
async function createRoute(req, res) {
  const { routeName, city, ward, neighborhood, routePoints } = req.body;
  if (!routeName) {
    return res.status(400).json({ error: 'Tên tuyến là bắt buộc.' });
  }
  try {
    const formattedPoints = (routePoints || []).map(p => {
      if (Array.isArray(p)) return { lat: p[0], lng: p[1] };
      return p;
    });
    const newRoute = {
      route_name: routeName,
      city: city || '',
      ward: ward || '',
      neighborhood: neighborhood || '',
      route_points: formattedPoints,
      created_by: req.userProfile?.fullName || req.uid,
      created_at: new Date().toISOString(),
    };
    const docRef = await db.collection('collection_routes').add(newRoute);
    
    // Map back for response to match frontend expectation
    newRoute.route_points = routePoints || [];
    return res.status(201).json({ success: true, id: docRef.id, route: newRoute });
  } catch (error) {
    console.error('[API] Lỗi tạo tuyến mẫu:', error.message);
    return res.status(500).json({ error: 'Không thể tạo tuyến mẫu.' });
  }
}

/**
 * PUT /api/manager/routes/:routeId
 */
async function updateRoute(req, res) {
  const { routeId } = req.params;
  const { routeName, city, ward, neighborhood, routePoints } = req.body;
  try {
    const formattedPoints = (routePoints || []).map(p => {
      if (Array.isArray(p)) return { lat: p[0], lng: p[1] };
      return p;
    });
    const docRef = db.collection('collection_routes').doc(routeId);
    await docRef.update({
      route_name: routeName,
      city: city || '',
      ward: ward || '',
      neighborhood: neighborhood || '',
      route_points: formattedPoints,
      updated_at: new Date().toISOString(),
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Lỗi cập nhật tuyến mẫu:', error.message);
    return res.status(500).json({ error: 'Không thể cập nhật tuyến mẫu.' });
  }
}

/**
 * DELETE /api/manager/routes/:routeId
 */
async function deleteRoute(req, res) {
  const { routeId } = req.params;
  try {
    await db.collection('collection_routes').doc(routeId).delete();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Không thể xóa tuyến mẫu.' });
  }
}

/**
 * GET /api/manager/teams
 */
async function getTeams(req, res) {
  try {
    const snapshot = await db.collection('collection_teams').get();
    const teams = [];
    snapshot.forEach(doc => teams.push({ id: doc.id, ...doc.data() }));
    return res.status(200).json(teams);
  } catch (error) {
    return res.status(500).json({ error: 'Không thể tải danh sách đội nhóm.' });
  }
}

/**
 * POST /api/manager/teams
 */
async function createTeam(req, res) {
  const { teamName, members } = req.body; // members = [{ id, name }, ...]
  if (!teamName || !members || members.length === 0) {
    return res.status(400).json({ error: 'Tên đội và thành viên là bắt buộc.' });
  }
  try {
    const newTeam = {
      team_name: teamName,
      members,
      created_by: req.userProfile?.fullName || req.uid,
      created_at: new Date().toISOString(),
    };
    const docRef = await db.collection('collection_teams').add(newTeam);
    return res.status(201).json({ success: true, id: docRef.id, team: newTeam });
  } catch (error) {
    return res.status(500).json({ error: 'Không thể tạo đội.' });
  }
}

/**
 * PUT /api/manager/teams/:teamId
 */
async function updateTeam(req, res) {
  const { teamId } = req.params;
  const { teamName, members } = req.body;
  try {
    await db.collection('collection_teams').doc(teamId).update({
      team_name: teamName,
      members,
      updated_at: new Date().toISOString(),
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Không thể cập nhật đội.' });
  }
}

/**
 * DELETE /api/manager/teams/:teamId
 */
async function deleteTeam(req, res) {
  const { teamId } = req.params;
  try {
    await db.collection('collection_teams').doc(teamId).delete();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Không thể xóa đội.' });
  }
}

/**
 * GET /api/manager/invoice-templates
 */
async function getInvoiceTemplates(req, res) {
  try {
    const snap = await db.collection('invoice_templates').orderBy('createdAt', 'desc').get();
    const templates = [];
    snap.forEach(d => templates.push({ id: d.id, ...d.data() }));
    return res.status(200).json(templates);
  } catch (error) {
    return res.status(500).json({ error: 'Không thể tải danh sách mẫu hóa đơn.' });
  }
}

/**
 * POST /api/manager/invoice-templates
 * Body: { name, feeType, amount, currency, dueOffsetDays, recurrence? }
 */
async function createInvoiceTemplate(req, res) {
  const { name, feeType, amount, currency, dueOffsetDays, recurrence } = req.body;
  if (!name || !feeType || !amount || !currency) {
    return res.status(400).json({ error: 'name, feeType, amount, currency là bắt buộc.' });
  }
  try {
    const data = {
      name: String(name).trim(),
      feeType,
      amount: Number(amount),
      currency: currency || 'VND',
      dueOffsetDays: Number(dueOffsetDays || 30),
      recurrence: recurrence || 'monthly',
      createdBy: req.uid,
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection('invoice_templates').add(data);
    return res.status(201).json({ id: docRef.id, ...data });
  } catch (error) {
    return res.status(500).json({ error: 'Không thể tạo mẫu hóa đơn.' });
  }
}

/**
 * DELETE /api/manager/invoice-templates/:templateId
 */
async function deleteInvoiceTemplate(req, res) {
  try {
    await db.collection('invoice_templates').doc(req.params.templateId).delete();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Không thể xóa mẫu hóa đơn.' });
  }
}

/**
 * GET /api/manager/dashboard/stats
 * Returns aggregated KPI data for recharts:
 *   revenueByMonth, complaintsByWeek, invoiceStatus, complaintStatus, completedByCollector
 */
async function getDashboardStats(req, res) {
  try {
    const [invoiceSnap, complaintSnap, scheduleSnap] = await Promise.all([
      db.collection('invoices').get(),
      db.collection('complaints').get(),
      db.collection('collection_schedules').get(),
    ]);

    const invoices = [];
    invoiceSnap.forEach(d => invoices.push({ id: d.id, ...d.data() }));

    const complaints = [];
    complaintSnap.forEach(d => complaints.push({ id: d.id, ...d.data() }));

    const schedules = [];
    scheduleSnap.forEach(d => schedules.push({ id: d.id, ...d.data() }));

    // 1. Revenue by month (last 6 months) � sum of paid invoices
    const revenueByMonth = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = 0;
    }
    invoices.forEach(inv => {
      if (inv.status !== 'paid') return;
      const yr = inv.billingYear || inv.year;
      const mo = inv.billingMonth || inv.month;
      if (!yr || !mo) return;
      const key = `${yr}-${String(mo).padStart(2, '0')}`;
      if (revenueByMonth[key] !== undefined) revenueByMonth[key] += Number(inv.amount || 0);
    });
    const revenueChart = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }));

    // 2. Complaints received vs resolved per week (last 4 weeks)
    const weekMap = {};
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() - i * 7);
      const label = `W${4 - i} (${start.getDate()}/${start.getMonth() + 1})`;
      weekMap[label] = { received: 0, resolved: 0, weekStart: start.getTime() };
    }
    const weekKeys = Object.keys(weekMap);
    complaints.forEach(c => {
      const ts = c.createdAt?.seconds ? c.createdAt.seconds * 1000 : (c.createdAt ? new Date(c.createdAt).getTime() : null);
      if (!ts) return;
      for (let i = weekKeys.length - 1; i >= 0; i--) {
        if (ts >= weekMap[weekKeys[i]].weekStart) {
          weekMap[weekKeys[i]].received++;
          if ((c.status || '').toLowerCase() === 'resolved') weekMap[weekKeys[i]].resolved++;
          break;
        }
      }
    });
    const complaintsChart = weekKeys.map(w => ({ week: w, received: weekMap[w].received, resolved: weekMap[w].resolved }));

    // 3. Invoice status breakdown (current month)
    const thisYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const invoiceStatus = { paid: 0, unpaid: 0, overdue: 0 };
    invoices.forEach(inv => {
      const yr = inv.billingYear || inv.year;
      const mo = inv.billingMonth || inv.month;
      const ym = yr && mo ? `${yr}-${String(mo).padStart(2, '0')}` : null;
      if (ym !== thisYm) return;
      const s = (inv.status || 'unpaid').toLowerCase();
      if (invoiceStatus[s] !== undefined) invoiceStatus[s]++;
    });
    const invoiceStatusChart = Object.entries(invoiceStatus).map(([name, value]) => ({ name, value }));

    // 4. Complaint status breakdown (all time)
    const cStatus = {};
    complaints.forEach(c => {
      const s = c.status || 'open';
      cStatus[s] = (cStatus[s] || 0) + 1;
    });
    const complaintStatusChart = Object.entries(cStatus).map(([name, value]) => ({ name, value }));

    // 5. Completed schedules count by collector (this week)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const collectorPayload = {};
    schedules.forEach(s => {
      if (!['completed', 'completed_pending_approval'].includes((s.status || '').toLowerCase())) return;
      const sDate = s.schedule_date ? new Date(s.schedule_date) : null;
      if (!sDate || sDate < weekStart) return;
      const col = s.assigned_collector || s.assignedCollector || 'Unknown';
      collectorPayload[col] = (collectorPayload[col] || 0) + 1;
    });
    const collectorChart = Object.entries(collectorPayload).map(([collector, completed]) => ({ collector, completed }));

    return res.status(200).json({ revenueChart, complaintsChart, invoiceStatusChart, complaintStatusChart, collectorChart });
  } catch (error) {
    console.error('[Dashboard] L?i t?ng h?p stats:', error.message);
    return res.status(500).json({ error: 'Không thể tải thống kê.' });
  }
}

/**
 * GET /api/manager/team-performance
 * Returns team completion stats for the current month
 */
async function getTeamPerformance(req, res) {
  try {
    const [teamSnap, schedSnap] = await Promise.all([
      db.collection('collection_teams').get(),
      db.collection('collection_schedules').get(),
    ]);

    const teams = [];
    teamSnap.forEach(doc => teams.push({ id: doc.id, ...doc.data() }));

    const schedules = [];
    schedSnap.forEach(doc => schedules.push({ id: doc.id, ...doc.data() }));

    // Current month filter
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const performance = teams.map(team => {
      const teamSchedules = schedules.filter(s => s.team_id === team.id);
      const monthSchedules = teamSchedules.filter(s => {
        if (!s.schedule_date) return false;
        const d = new Date(s.schedule_date);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
      });

      const completed = monthSchedules.filter(s => {
        const status = (s.status || '').toLowerCase();
        return status === 'completed' || status === 'completed_pending_approval';
      }).length;

      return {
        teamId: team.id,
        teamName: team.team_name || '',
        members: team.members || [],
        totalRoutes: monthSchedules.length,
        completedRoutes: completed,
        completionRate: monthSchedules.length > 0 ? Math.round((completed / monthSchedules.length) * 100) : 0,
      };
    });

    // Sort by completed routes descending
    performance.sort((a, b) => b.completedRoutes - a.completedRoutes);

    return res.status(200).json({ success: true, data: performance, month: currentMonth, year: currentYear });
  } catch (error) {
    console.error('[Manager] Lỗi lấy hiệu suất đội:', error.message);
    return res.status(500).json({ error: 'Không thể tải dữ liệu hiệu suất đội.' });
  }
}

/**
 * GET /api/manager/collector-salaries?month=8&year=2026
 */
async function getCollectorSalaries(req, res) {
  try {
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const snap = await db.collection('collector_salaries')
      .where('month', '==', month)
      .where('year', '==', year)
      .get();

    const salaries = [];
    snap.forEach(doc => {
      const data = doc.data();
      salaries.push({
        id: doc.id,
        ...data,
        totalSalary: (data.baseSalary || 0) + (data.bonus || 0),
      });
    });

    return res.status(200).json({ success: true, data: salaries });
  } catch (error) {
    console.error('[Manager] Lỗi lấy lương collectors:', error.message);
    return res.status(500).json({ error: 'Không thể tải dữ liệu lương.' });
  }
}

/**
 * POST /api/manager/collector-salaries
 * Body: { collectorId, collectorName, month, year, baseSalary, bonus, bonusReason }
 */
async function setCollectorSalary(req, res) {
  const { collectorId, collectorName, month, year, baseSalary, bonus, bonusReason } = req.body;

  if (!collectorId || !month || !year) {
    return res.status(400).json({ error: 'collectorId, month và year là bắt buộc.' });
  }

  try {
    // Check if salary record already exists for this collector/month/year
    const existing = await db.collection('collector_salaries')
      .where('collectorId', '==', collectorId)
      .where('month', '==', Number(month))
      .where('year', '==', Number(year))
      .get();

    const now = new Date().toISOString();
    const salaryData = {
      collectorId,
      collectorName: collectorName || '',
      month: Number(month),
      year: Number(year),
      baseSalary: Number(baseSalary) || 0,
      bonus: Number(bonus) || 0,
      bonusReason: bonusReason || '',
      assignedBy: req.userProfile?.fullName || req.uid,
      updatedAt: now,
    };

    if (!existing.empty) {
      // Update existing record
      const docId = existing.docs[0].id;
      await db.collection('collector_salaries').doc(docId).update(salaryData);
      return res.status(200).json({ success: true, message: 'Đã cập nhật lương thành công.', id: docId });
    } else {
      // Create new record
      salaryData.createdAt = now;
      const docRef = await db.collection('collector_salaries').add(salaryData);
      return res.status(201).json({ success: true, message: 'Đã tạo bảng lương thành công.', id: docRef.id });
    }
  } catch (error) {
    console.error('[Manager] Lỗi cập nhật lương collector:', error.message);
    return res.status(500).json({ error: 'Không thể cập nhật lương.' });
  }
}

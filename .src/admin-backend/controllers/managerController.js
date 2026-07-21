const { db } = require('../config/firebase');
const { ROLES } = require('../constants/roles');
const { normalizeUser } = require('../helpers/normalizeUser');
const complaintService = require('../services/complaintService');
const reportService = require('../services/reportService');
const invoiceService = require('../services/invoiceService');

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
    snapshot.forEach((doc) => schedules.push({ id: doc.id, ...doc.data() }));
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
    notes,
    routePoints,
  } = req.body;

  if (!routeName || !serviceType || !date || !time || !city || !ward) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin lịch thu gom.' });
  }

  if (routePoints && !Array.isArray(routePoints)) {
    return res.status(400).json({ error: 'routePoints phải là một mảng các điểm tọa độ.' });
  }

  try {
    const scheduleDate = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ error: 'Ngày hoặc giờ không hợp lệ.' });
    }

    const newSchedule = {
      route_name: routeName,
      service_type: serviceType,
      schedule_date: scheduleDate.toISOString(),
      city,
      ward,
      neighborhood: neighborhood || '',
      assigned_truck: assignedTruck || '',
      assigned_driver: assignedDriver || '',
      assigned_collector: assignedCollector || '',
      collector_confirmed: false,
      status: assignedTruck && assignedDriver ? 'Assigned' : 'Planned',
      notes: notes || '',
      route_points: routePoints || [],
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

/**
 * POST /api/manager/invoices
 */
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

    return res.status(201).json(invoice);
  } catch (error) {
    console.error('[API] Lỗi tạo hóa đơn bởi manager:', error.message);
    return res.status(500).json({ error: error.message });
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
};

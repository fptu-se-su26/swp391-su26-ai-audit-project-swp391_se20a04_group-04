const { admin, db } = require('../config/firebase');
const { ROLES } = require('../constants/roles');
const { normalizeUser } = require('../helpers/normalizeUser');
const complaintService = require('../services/complaintService');
const reportService = require('../services/reportService');
const invoiceService = require('../services/invoiceService');
const scheduleCompletionService = require('../services/scheduleCompletionService');
const attendanceService = require('../services/attendanceService');

const USERS_COLLECTION = 'users';

/**
 * GET /api/manager/collectors
 */
async function getCollectors(req, res) {
  try {
    const snapshot = await db.collection(USERS_COLLECTION).where('role', 'in', ['collector', 'Garbage Collector', 'GarbageCollector']).get();
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
      schedule_time: time,
      time: time,
      routeId: req.body.routeId || req.body.route_id || null,
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
 * PUT/PATCH /api/manager/schedules/:scheduleId
 */
async function updateSchedule(req, res) {
  const { scheduleId } = req.params;
  const {
    routeName,
    serviceType,
    date,
    time,
    scheduleDate,
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
    status,
    incident,
    routeId,
  } = req.body;

  if (!scheduleId) {
    return res.status(400).json({ error: 'Vui lòng cung cấp ID lịch để cập nhật.' });
  }

  try {
    const docRef = db.collection('collection_schedules').doc(scheduleId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Không tìm thấy lịch cần cập nhật.' });
    }

    const updateFields = {
      updated_at: new Date().toISOString(),
    };

    if (routeName !== undefined) updateFields.route_name = routeName;
    if (serviceType !== undefined) updateFields.service_type = serviceType;
    if (date || scheduleDate || time) {
      const dStr = date || scheduleDate || snapshot.data().schedule_date;
      const tStr = time || snapshot.data().time || '08:00';
      const parsedDate = new Date(`${dStr.slice(0, 10)}T${tStr}`);
      if (!Number.isNaN(parsedDate.getTime())) {
        updateFields.schedule_date = parsedDate.toISOString();
        updateFields.schedule_time = tStr;
        updateFields.time = tStr;
      }
    }
    if (city !== undefined) updateFields.city = city;
    if (ward !== undefined) updateFields.ward = ward;
    if (neighborhood !== undefined) updateFields.neighborhood = neighborhood;
    if (assignedTruck !== undefined) updateFields.assigned_truck = assignedTruck;
    if (assignedDriver !== undefined) updateFields.assigned_driver = assignedDriver;
    if (assignedCollector !== undefined) updateFields.assigned_collector = assignedCollector;
    if (assignedCollectors !== undefined) updateFields.assigned_collectors = assignedCollectors;
    if (teamId !== undefined) updateFields.team_id = teamId;
    if (notes !== undefined) updateFields.notes = notes;
    if (routeId !== undefined) updateFields.routeId = routeId;

    if (routePoints !== undefined) {
      if (!Array.isArray(routePoints)) {
        return res.status(400).json({ error: 'routePoints phải là một mảng các điểm tọa độ.' });
      }
      const formattedPoints = routePoints.map(p => {
        if (Array.isArray(p) && p.length >= 2) return { lat: Number(p[0]), lng: Number(p[1]) };
        if (p && typeof p === 'object' && p.lat !== undefined && p.lng !== undefined) return { lat: Number(p.lat), lng: Number(p.lng) };
        return p;
      });
      updateFields.route_points = formattedPoints;
    }

    if (status !== undefined) {
      updateFields.status = status;
    }

    if (incident !== undefined) {
      if (incident === null) {
        updateFields.incident = admin.firestore.FieldValue.delete();
      } else {
        updateFields.incident = incident;
      }
    }

    await docRef.update(updateFields);
    return res.status(200).json({ success: true, message: 'Đã cập nhật lịch thu gom thành công.' });
  } catch (error) {
    console.error('[API] Lỗi cập nhật lịch thu gom:', error.message);
    return res.status(500).json({ error: 'Không thể cập nhật lịch. Vui lòng thử lại sau.' });
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
      invoices.push(invoiceService.serializeInvoice(doc));
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
      area,
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

    let bMonth = Number(billingMonth);
    let bYear = Number(billingYear);
    if ((!bMonth || Number.isNaN(bMonth) || !bYear || Number.isNaN(bYear)) && dueDate) {
      const d = new Date(dueDate);
      if (!Number.isNaN(d.getTime())) {
        bMonth = d.getMonth() + 1;
        bYear = d.getFullYear();
      }
    }

    if (Number.isNaN(bMonth) || bMonth < 1 || bMonth > 12 || Number.isNaN(bYear)) {
      return res.status(400).json({ error: 'billingMonth (1-12) và billingYear không hợp lệ.' });
    }

    const creatorName = createdBy || req.userProfile?.fullName || req.uid;

    if (area) {
      // CASE A: Tạo hóa đơn hàng loạt theo khu vực chỉ định
      if (!amount || !currency || !dueDate || !feeType) {
        return res.status(400).json({ error: 'amount, currency, dueDate và feeType là bắt buộc khi tạo theo khu vực.' });
      }

      const snapshot = await db.collection(USERS_COLLECTION)
        .where('role', '==', 'resident')
        .get();

      const matchingResidents = [];
      snapshot.forEach(doc => {
        const u = doc.data();
        const userArea = (u.area || u['khu vực'] || u['khu_vuc'] || '').toLowerCase();
        const userAddress = (u.address || u['Địa chỉ'] || u['dia_chi'] || '').toLowerCase();
        const target = area.toLowerCase().trim();

        if (userArea.includes(target) || userAddress.includes(target)) {
          matchingResidents.push({ uid: doc.id, ...u });
        }
      });

      if (matchingResidents.length === 0) {
        return res.status(404).json({ error: `Không tìm thấy cư dân nào thuộc khu vực "${area}".` });
      }

      const batch = db.batch();
      const createdInvoices = [];
      const nowStr = new Date().toISOString();
      const dueDateFormatted = new Date(dueDate).toLocaleDateString('vi-VN');

      for (const resident of matchingResidents) {
        const invId = `invoice_${resident.uid}_${bYear}_${String(bMonth).padStart(2, '0')}`;

        // Kiểm tra trùng lặp chưa thanh toán
        const dupCheck = await db.collection('invoices')
          .where('userId', '==', resident.uid)
          .where('billingMonth', '==', bMonth)
          .where('billingYear', '==', bYear)
          .where('status', '==', 'unpaid')
          .get();

        if (!dupCheck.empty) {
          continue; // Bỏ qua cư dân đã có hóa đơn chưa thanh toán kỳ này
        }

        const invoiceData = {
          invoiceId: invId,
          userId: resident.uid,
          amount: Number(amount),
          billingMonth: bMonth,
          billingYear: bYear,
          createdAt: nowStr,
          createdBy: creatorName,
          currency: currency || 'VND',
          dueDate,
          feeType: feeType || 'monthly_sanitation_fee',
          paidAt: null,
          status: 'unpaid',
          updatedAt: nowStr,
        };

        const invRef = db.collection('invoices').doc(invId);
        batch.set(invRef, invoiceData);

        const notifRef = db.collection('notifications').doc();
        batch.set(notifRef, {
          user_id: resident.uid,
          title: 'Hóa đơn mới',
          content: `Hóa đơn phí vệ sinh môi trường tháng ${bMonth}/${bYear} đã được phát hành cho khu vực của bạn. Số tiền: ${Number(amount).toLocaleString('vi-VN')} ₫. Hạn thanh toán: ${dueDateFormatted}. Vui lòng thanh toán đúng hạn.`,
          type: 'invoice_created',
          is_read: false,
          sent_at: new Date(),
        });

        createdInvoices.push(invoiceData);
      }

      if (createdInvoices.length === 0) {
        return res.status(400).json({ error: 'Tất cả cư dân trong khu vực này đã có hóa đơn kỳ này.' });
      }

      await batch.commit();
      return res.status(201).json({
        success: true,
        count: createdInvoices.length,
        invoices: createdInvoices,
      });
    } else {
      // CASE B: Tạo hóa đơn đơn lẻ cho một cư dân (Logic cũ)
      if (!invoiceId || !userId || !amount || !currency || !dueDate || !feeType) {
        return res.status(400).json({ error: 'invoiceId, userId, amount, currency, dueDate và feeType là bắt buộc.' });
      }

      const existingSnapshot = await db.collection('invoices')
        .where('userId', '==', userId)
        .where('billingMonth', '==', bMonth)
        .where('billingYear', '==', bYear)
        .where('status', '==', 'unpaid')
        .get();

      if (!existingSnapshot.empty) {
        return res.status(409).json({
          error: `Cư dân này đã có hóa đơn chưa thanh toán cho tháng ${bMonth}/${bYear}. Không thể tạo thêm.`,
        });
      }

      const invoice = await invoiceService.createOrUpdateInvoice({
        invoiceId,
        userId,
        amount,
        billingMonth: bMonth,
        billingYear: bYear,
        createdAt: createdAt || new Date().toISOString(),
        createdBy: creatorName,
        currency,
        dueDate,
        feeType,
        paidAt: paidAt || null,
        status: status || 'unpaid',
        updatedAt: new Date().toISOString(),
      });

      const dueDateFormatted = new Date(dueDate).toLocaleDateString('vi-VN');
      await db.collection('notifications').add({
        user_id: userId,
        title: 'Hóa đơn mới',
        content: `Hóa đơn phí vệ sinh môi trường tháng ${bMonth}/${bYear} đã được phát hành. Số tiền: ${Number(amount).toLocaleString('vi-VN')} ₫. Hạn thanh toán: ${dueDateFormatted}. Vui lòng thanh toán đúng hạn.`,
        type: 'invoice_created',
        is_read: false,
        sent_at: new Date(),
      });

      return res.status(201).json(invoice);
    }
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

async function getAttendanceSummary(req, res) {
  try {
    const { date, month, year } = req.query;
    const data = await attendanceService.getManagerAttendanceSummary(date, month, year);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[API] Lỗi lấy báo cáo chấm công:', error.message);
    return res.status(500).json({ error: 'Không thể tải dữ liệu chấm công.' });
  }
}

async function getResidentAreas(req, res) {
  try {
    const snapshot = await db.collection(USERS_COLLECTION)
      .where('role', '==', 'resident')
      .get();

    const areasSet = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      const area = data.area || data['khu vực'] || data['khu_vuc'] || '';
      if (area.trim()) {
        areasSet.add(area.trim());
      }
    });

    return res.status(200).json(Array.from(areasSet));
  } catch (error) {
    console.error('[Manager] Lỗi lấy danh sách khu vực:', error.message);
    return res.status(500).json({ error: 'Không thể tải danh sách khu vực.' });
  }
}

module.exports = {
  getResidentAreas,
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
  getAttendanceSummary,
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

    // 1. Revenue by month (last 6 months) — sum of paid invoices
    const revenueByMonth = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = 0;
    }
    invoices.forEach(inv => {
      const s = (inv.status || '').toLowerCase();
      if (s !== 'paid' && s !== 'completed' && s !== 'success') return;
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
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1) - i * 7;
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      const label = `W${4 - i} (${start.getDate()}/${start.getMonth() + 1})`;
      weekMap[label] = { received: 0, resolved: 0, weekStart: start.getTime() };
    }
    const weekKeys = Object.keys(weekMap);
    complaints.forEach(c => {
      const dateVal = c.createdAt || c.created_at;
      const ts = dateVal?.seconds 
        ? dateVal.seconds * 1000 
        : (dateVal ? new Date(dateVal).getTime() : null);
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

    // 3. Invoice status breakdown (current month or fallback to all active invoices)
    const thisYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let invoiceStatus = { paid: 0, unpaid: 0, overdue: 0 };
    let monthInvoicesCount = 0;

    invoices.forEach(inv => {
      const yr = inv.billingYear || inv.year || (inv.createdAt ? new Date(inv.createdAt).getFullYear() : null);
      const mo = inv.billingMonth || inv.month || (inv.createdAt ? new Date(inv.createdAt).getMonth() + 1 : null);
      const ym = yr && mo ? `${yr}-${String(mo).padStart(2, '0')}` : null;
      if (ym === thisYm) {
        monthInvoicesCount++;
        const s = (inv.status || 'unpaid').toLowerCase();
        if (s === 'paid' || s === 'completed' || s === 'success') invoiceStatus.paid++;
        else if (s === 'overdue') invoiceStatus.overdue++;
        else invoiceStatus.unpaid++;
      }
    });

    // Fallback: If no invoices exist for current month, count all invoices
    if (monthInvoicesCount === 0 && invoices.length > 0) {
      invoices.forEach(inv => {
        const s = (inv.status || 'unpaid').toLowerCase();
        if (s === 'paid' || s === 'completed' || s === 'success') invoiceStatus.paid++;
        else if (s === 'overdue') invoiceStatus.overdue++;
        else invoiceStatus.unpaid++;
      });
    }

    const statusLabels = {
      paid: 'Đã thanh toán',
      unpaid: 'Chưa thanh toán',
      overdue: 'Quá hạn'
    };
    const invoiceStatusChart = Object.entries(invoiceStatus).map(([name, value]) => ({ 
      name: statusLabels[name] || name, 
      value 
    }));

    // 4. Complaint status breakdown (all time)
    const cStatus = {};
    complaints.forEach(c => {
      const st = (c.status || 'open').toLowerCase();
      cStatus[st] = (cStatus[st] || 0) + 1;
    });
    const complaintStatusChart = Object.entries(cStatus).map(([name, value]) => ({ name, value }));

    // 5. Completed schedules count by collector (this week - starts on Monday, Vietnam UTC+7)
    const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7
    const nowVN = new Date(now.getTime() + VN_OFFSET_MS);
    const dayVN = nowVN.getUTCDay(); // 0=Sun in VN local time
    const mondayOffsetDays = dayVN === 0 ? -6 : 1 - dayVN;
    const mondayVN = new Date(nowVN);
    mondayVN.setUTCDate(nowVN.getUTCDate() + mondayOffsetDays);
    mondayVN.setUTCHours(0, 0, 0, 0);
    // Convert back to UTC for comparison with schedule_date
    const weekStart = new Date(mondayVN.getTime() - VN_OFFSET_MS);

    const collectorPayload = {};
    schedules.forEach(s => {
      if (!['completed', 'completed_pending_approval'].includes((s.status || '').toLowerCase())) return;
      const sDate = s.schedule_date ? new Date(s.schedule_date) : null;
      if (!sDate || isNaN(sDate.getTime()) || sDate < weekStart) return;

      // Đếm cho từng collector (đơn lẻ hoặc mảng assigned_collectors)
      let cols = [];
      if (Array.isArray(s.assigned_collectors) && s.assigned_collectors.length > 0) {
        cols = s.assigned_collectors.map(c => (typeof c === 'string' ? c : c.name || c.fullName || 'Unknown'));
      } else {
        const singleCol = s.assigned_collector || s.assignedCollector;
        if (singleCol) {
          cols = [singleCol];
        }
      }

      // FIX: Nếu vẫn không có collector nào, fallback về team_name hoặc team_id
      if (cols.length === 0) {
        const teamLabel = s.team_name || s.teamName || (s.team_id ? `Đội ${s.team_id}` : null);
        if (teamLabel) cols = [teamLabel];
      }

      cols.forEach(col => {
        collectorPayload[col] = (collectorPayload[col] || 0) + 1;
      });
    });
    const collectorChart = Object.entries(collectorPayload)
      .map(([collector, completed]) => ({ collector, completed }))
      .sort((a, b) => b.completed - a.completed);

    // 6. KPI Summary Calculation
    const totalSchedules = schedules.length;
    const assignedRoutes = schedules.filter(s => s.assigned_collector || s.assignedCollector || s.team_id || s.teamId || s.assigned_driver).length;
    const openComplaints = complaints.filter(c => (c.status || 'open').toLowerCase() === 'open').length;

    let totalCompleted = 0;
    let onTimeCompleted = 0;
    schedules.forEach(s => {
      const status = (s.status || '').toLowerCase();
      if (['completed', 'completed_pending_approval'].includes(status)) {
        totalCompleted++;
        if (!s.incident) {
          onTimeCompleted++;
        }
      }
    });
    const onTimeRate = totalCompleted > 0 ? Math.round((onTimeCompleted / totalCompleted) * 100) : 100;

    return res.status(200).json({ 
      revenueChart, complaintsChart, invoiceStatusChart, complaintStatusChart, collectorChart,
      totalSchedules, assignedRoutes, openComplaints, onTimeRate
    });
  } catch (error) {
    console.error('[Dashboard] Lỗi tổng hợp stats:', error.message);
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
    const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    // Lấy danh sách collectors
    const collectorsSnap = await db.collection(USERS_COLLECTION)
      .where('role', 'in', ['collector', 'Garbage Collector', 'GarbageCollector'])
      .get();

    // Lấy các bản ghi lương đã lưu trong DB
    const salarySnap = await db.collection('collector_salaries')
      .where('month', '==', month)
      .where('year', '==', year)
      .get();

    const savedSalariesMap = {};
    salarySnap.forEach(doc => {
      savedSalariesMap[doc.data().collectorId] = { id: doc.id, ...doc.data() };
    });

    const result = [];
    for (const doc of collectorsSnap.docs) {
      const col = normalizeUser(doc.data(), doc.id);
      const details = await attendanceService.calculateCollectorSalaryDetails(doc.id, month, year);
      const saved = savedSalariesMap[doc.id] || {};

      const baseSalary = saved.baseSalary !== undefined ? Number(saved.baseSalary) : details.calculatedBaseSalary;
      const bonus = Number(saved.bonus || 0);
      const totalSalary = baseSalary + bonus;

      result.push({
        id: saved.id || doc.id,
        collectorId: doc.id,
        collectorName: col.fullName || saved.collectorName || 'Nhân viên',
        email: col.email || '',
        month,
        year,
        baseSalary,
        bonus,
        bonusReason: saved.bonusReason || '',
        totalSalary,
        attendanceDetails: {
          totalHours: details.totalHours,
          daysWorked: details.daysWorked,
          completedRoutes: details.completedRoutes,
          hourlyRate: details.hourlyRate,
          routeBonusRate: details.routeBonusRate,
          hazardAllowance: details.hazardAllowance,
          hourlyPay: details.hourlyPay,
          routePay: details.routePay,
          calculatedBaseSalary: details.calculatedBaseSalary,
        },
      });
    }

    return res.status(200).json({ success: true, data: result });
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

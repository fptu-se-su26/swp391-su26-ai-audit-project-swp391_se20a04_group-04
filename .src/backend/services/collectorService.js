const { db } = require('../config/firebase');
const { ROLES } = require('../constants/roles');

const ASSIGNMENTS_COLLECTION = 'route_assignments';
const SCHEDULES_COLLECTION = 'collection_schedules';
const ROUTES_COLLECTION = 'routes';
const USERS_COLLECTION = 'users';
const NOTIFICATIONS_COLLECTION = 'notifications';

const REPORTS_COLLECTION = 'reports';
const REPORT_COMMENTS_COLLECTION = 'report_comments';

const STARTABLE = new Set(['assigned', 'confirmed', 'published', 'updated', 'active', 'planned']);
const COMPLETABLE = new Set(['in_progress']);
const REPORT_STARTABLE = new Set(['assigned', 'submitted', 'verified']);
const REPORT_RESOLVABLE = new Set(['in_progress']);
const REPORT_PENDING_COLLECTOR = new Set(['assigned', 'submitted', 'verified', 'in_progress']);

function normalizeStatus(status) {
  return (status || 'assigned').toLowerCase().replace(/\s+/g, '_');
}

function toIsoString(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function mapReport(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    reportId: data.reportId || doc.id,
    citizenId: data.citizenId,
    title: data.title || '',
    description: data.description || '',
    category: data.category || '',
    severity: data.severity || 'medium',
    imageUrls: data.imageUrls || [],
    location: data.location || null,
    city: data.city || '',
    district: data.district || '',
    ward: data.ward || '',
    neighborhood: data.neighborhood || '',
    assignedTo: data.assignedTo,
    assignedBy: data.assignedBy,
    status: normalizeStatus(data.status),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    resolvedAt: toIsoString(data.resolvedAt),
  };
}

function toDateKey(value) {
  if (!value) return null;
  const d = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function parseRoutePoints(route, schedule) {
  if (schedule?.route_points?.length) return schedule.route_points;
  if (route?.startPoint && route?.endPoint) {
    return [
      [route.startPoint.lat, route.startPoint.lng],
      [route.endPoint.lat, route.endPoint.lng],
    ];
  }
  return [];
}

async function getRouteMap() {
  const snap = await db.collection(ROUTES_COLLECTION).get();
  const map = {};
  snap.forEach((doc) => {
    map[doc.id] = { id: doc.id, ...doc.data() };
  });
  return map;
}

function matchesCollector(data, collectorId, collectorName) {
  // Check all fields where a collector could be referenced
  const candidates = [
    data.assigned_collector,
    data.collector_id,
    data.collectorId,
    data.assigned_driver, // managers sometimes put the collector name in driver field
  ].filter(Boolean);

  let isMatch = candidates.some(
    (v) => v === collectorId || (collectorName && v === collectorName),
  );

  if (isMatch) return true;

  if (data.assigned_collectors && Array.isArray(data.assigned_collectors)) {
    isMatch = data.assigned_collectors.some(c => c.id === collectorId || c.name === collectorName);
  }

  return isMatch;
}

function mapAssignment(doc, routes, targetDate) {
  const data = doc.data();
  const assignedKey = toDateKey(data.assignedDate);
  if (!assignedKey) return null;
  if (targetDate && assignedKey !== targetDate) return null;

  const route = routes[data.routeId] || {};
  return {
    id: doc.id,
    sourceType: 'assignment',
    assignmentId: data.assignmentId || doc.id,
    routeId: data.routeId,
    routeName: route.routeName || data.routeId,
    date: assignedKey,
    startTime: data.startTime || '',
    endTime: data.endTime || '',
    wasteType: data.wasteType || '',
    ward: (route.wards || [])[0] || '',
    neighborhood: (route.neighborhoods || [])[0] || '',
    vehicleCode: data.vehicleCode || '',
    status: normalizeStatus(data.status),
    routePoints: parseRoutePoints(route, null),
    evidenceUrls: data.evidenceUrls || [],
    incident: data.incident || null,
    notes: '',
    startedAt: data.startedAt?.toDate?.()?.toISOString?.() || data.startedAt || null,
    completedAt: data.completedAt?.toDate?.()?.toISOString?.() || data.completedAt || null,
  };
}

function mapSchedule(doc, routes, targetDate, collectorId, collectorName) {
  const data = doc.data();
  if (!matchesCollector(data, collectorId, collectorName)) return null;

  const dateField = data.schedule_date || data.scheduleDate;
  const assignedKey = toDateKey(dateField);
  if (!assignedKey) return null;
  if (targetDate && assignedKey !== targetDate) return null;

  const route = routes[data.routeId] || {};
  const timeParts = (data.time_slot || '').split(' - ');

  return {
    id: doc.id,
    sourceType: 'schedule',
    scheduleId: data.scheduleId || doc.id,
    routeId: data.routeId,
    routeName: data.route_name || route.routeName || 'Tuyến thu gom',
    date: assignedKey,
    startTime: data.startTime || timeParts[0] || '',
    endTime: data.endTime || timeParts[1] || '',
    wasteType: data.trash_type || data.service_type || '',
    ward: data.ward || '',
    neighborhood: data.neighborhood || '',
    vehicleCode: data.assigned_truck || '',
    status: normalizeStatus(data.status),
    routePoints: parseRoutePoints(route, data),
    evidenceUrls: data.evidence_urls || data.evidenceUrls || [],
    incident: data.incident || null,
    notes: data.notes || data.note || '',
    startedAt: data.started_at || null,
    completedAt: data.completed_at || null,
    teamId: data.team_id || null,
    assignedCollectors: data.assigned_collectors || [],
  };
}

async function getDailySchedules(collectorId, collectorName, dateStr) {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10);
  const routes = await getRouteMap();
  const items = [];
  const seen = new Set();

  const assignSnap = await db
    .collection(ASSIGNMENTS_COLLECTION)
    .where('collectorId', '==', collectorId)
    .get();

  assignSnap.forEach((doc) => {
    const item = mapAssignment(doc, routes, targetDate);
    if (item) {
      items.push(item);
      seen.add(`assignment:${doc.id}`);
    }
  });

  const schedSnap = await db.collection(SCHEDULES_COLLECTION).get();
  schedSnap.forEach((doc) => {
    if (seen.has(`schedule:${doc.id}`)) return;
    const item = mapSchedule(doc, routes, targetDate, collectorId, collectorName);
    if (item) {
      items.push(item);
      seen.add(`schedule:${doc.id}`);
    }
  });

  items.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  return { date: targetDate, items };
}

async function getAllSchedules(collectorId, collectorName) {
  const routes = await getRouteMap();
  const items = [];
  const seen = new Set();

  const assignSnap = await db
    .collection(ASSIGNMENTS_COLLECTION)
    .where('collectorId', '==', collectorId)
    .get();

  assignSnap.forEach((doc) => {
    const item = mapAssignment(doc, routes, null);
    if (item) {
      items.push(item);
      seen.add(`assignment:${doc.id}`);
    }
  });

  const schedSnap = await db.collection(SCHEDULES_COLLECTION).get();
  schedSnap.forEach((doc) => {
    if (seen.has(`schedule:${doc.id}`)) return;
    const item = mapSchedule(doc, routes, null, collectorId, collectorName);
    if (item) {
      items.push(item);
      seen.add(`schedule:${doc.id}`);
    }
  });

  items.sort((a, b) => {
    const byDate = (a.date || '').localeCompare(b.date || '');
    if (byDate !== 0) return byDate;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  return { items, total: items.length };
}

async function getAssignmentsInRange(collectorId, fromDate, toDate) {
  const routes = await getRouteMap();
  const items = [];
  const from = fromDate || new Date().toISOString().slice(0, 10);
  const to = toDate || from;

  const assignSnap = await db
    .collection(ASSIGNMENTS_COLLECTION)
    .where('collectorId', '==', collectorId)
    .get();

  assignSnap.forEach((doc) => {
    const data = doc.data();
    const key = toDateKey(data.assignedDate);
    if (!key || key < from || key > to) return;
    const route = routes[data.routeId] || {};
    items.push({
      assignmentId: data.assignmentId || doc.id,
      routeId: data.routeId,
      routeName: route.routeName || data.routeId,
      collectorId: data.collectorId,
      assignedDate: key,
      startTime: data.startTime,
      endTime: data.endTime,
      vehicleCode: data.vehicleCode,
      status: normalizeStatus(data.status),
    });
  });

  return items.sort((a, b) => a.assignedDate.localeCompare(b.assignedDate));
}

async function getDashboardSummary(collectorId, collectorName, dateStr) {
  const { items } = await getDailySchedules(collectorId, collectorName, dateStr);
  const reports = await getAssignedReports(collectorId);
  const pendingReports = reports.filter(
    (r) => REPORT_PENDING_COLLECTOR.has(normalizeStatus(r.status)),
  ).length;

  return {
    todayAssignments: items.length,
    completedAssignments: items.filter((i) => normalizeStatus(i.status) === 'completed').length,
    inProgressAssignments: items.filter((i) => normalizeStatus(i.status) === 'in_progress').length,
    pendingReports,
  };
}

async function getAssignedReports(collectorId) {
  const snap = await db
    .collection(REPORTS_COLLECTION)
    .where('assignedTo', '==', collectorId)
    .get();

  const reports = snap.docs.map(mapReport);
  reports.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  return reports;
}

async function getReportById(reportId, collectorId) {
  const docRef = db.collection(REPORTS_COLLECTION).doc(reportId);
  const snap = await docRef.get();
  if (!snap.exists) {
    const err = new Error('Không tìm thấy phản ánh.');
    err.status = 404;
    throw err;
  }
  const report = mapReport(snap);
  if (report.assignedTo !== collectorId) {
    const err = new Error('Bạn không có quyền xem phản ánh này.');
    err.status = 403;
    throw err;
  }
  return report;
}

async function getReportComments(reportId, collectorId) {
  await getReportById(reportId, collectorId);
  const snap = await db
    .collection(REPORT_COMMENTS_COLLECTION)
    .where('reportId', '==', reportId)
    .get();

  const comments = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      commentId: data.commentId || doc.id,
      reportId: data.reportId,
      userId: data.userId,
      role: data.role,
      message: data.message || '',
      imageUrls: data.imageUrls || [],
      action: data.action || '',
      createdAt: toIsoString(data.createdAt),
    };
  });

  comments.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  return comments;
}

async function updateReportStatus(collectorId, collectorProfile, reportId, payload) {
  const { status, message, imageUrls } = payload;
  const docRef = db.collection(REPORTS_COLLECTION).doc(reportId);
  const snap = await docRef.get();

  if (!snap.exists) {
    const err = new Error('Không tìm thấy phản ánh.');
    err.status = 404;
    throw err;
  }

  const data = snap.data();
  if (data.assignedTo !== collectorId) {
    const err = new Error('Bạn không có quyền cập nhật phản ánh này.');
    err.status = 403;
    throw err;
  }

  const currentStatus = normalizeStatus(data.status);
  const nextStatus = normalizeStatus(status);
  const now = new Date();
  const trimmedMessage = (message || '').trim();

  if (nextStatus === 'in_progress') {
    if (!REPORT_STARTABLE.has(currentStatus) && currentStatus !== 'in_progress') {
      const err = new Error(`Không thể bắt đầu xử lý khi trạng thái là "${currentStatus}".`);
      err.status = 400;
      throw err;
    }
  } else if (nextStatus === 'resolved_pending_approval' || nextStatus === 'resolved') {
    if (!REPORT_RESOLVABLE.has(currentStatus)) {
      const err = new Error(`Không thể hoàn thành khi trạng thái là "${currentStatus}".`);
      err.status = 400;
      throw err;
    }
    if (trimmedMessage.length < 10) {
      const err = new Error('Mô tả kết quả xử lý phải có ít nhất 10 ký tự.');
      err.status = 400;
      throw err;
    }
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      const err = new Error('Vui lòng upload ít nhất 1 ảnh đối chứng khi hoàn thành.');
      err.status = 400;
      throw err;
    }
  } else {
    const err = new Error('Trạng thái không hợp lệ. Dùng in_progress hoặc resolved_pending_approval.');
    err.status = 400;
    throw err;
  }

  const finalStatus = nextStatus === 'resolved' ? 'resolved_pending_approval' : nextStatus;

  const update = {
    status: finalStatus,
    updatedAt: now,
  };
  if (finalStatus === 'resolved_pending_approval') {
    update.resolvedAt = now;
    update.resolutionImageUrls = imageUrls;
  }

  await docRef.update(update);

  const commentRef = db.collection(REPORT_COMMENTS_COLLECTION).doc();
  await commentRef.set({
    commentId: commentRef.id,
    reportId,
    userId: collectorId,
    role: ROLES.COLLECTOR,
    message: trimmedMessage || (nextStatus === 'in_progress'
      ? 'Đã đến hiện trường, đang xử lý.'
      : 'Đã hoàn thành xử lý, chờ Manager duyệt.'),
    imageUrls: imageUrls || [],
    action: finalStatus,
    createdAt: now,
  });

  const refreshed = await docRef.get();
  return {
    success: true,
    report: mapReport(refreshed),
  };
}

async function notifyResidentsScheduleDelayed({ ward, routeName, description }) {
  if (!ward) return { notified: 0 };

  const usersSnap = await db
    .collection(USERS_COLLECTION)
    .where('role', '==', ROLES.RESIDENT)
    .where('ward', '==', ward)
    .get();

  if (usersSnap.empty) return { notified: 0 };

  const batch = db.batch();
  const now = new Date();
  const content = description
    || `Lịch thu gom tuyến "${routeName || 'được phân công'}" tại ${ward} bị hoãn. Vui lòng theo dõi lịch mới trên EcoSchedule.`;

  usersSnap.docs.forEach((doc) => {
    const ref = db.collection(NOTIFICATIONS_COLLECTION).doc();
    batch.set(ref, {
      user_id: doc.id,
      title: 'Thông báo: Lịch thu gom bị hoãn',
      content,
      type: 'schedule',
      sent_at: now,
      is_read: false,
      link: '/tra-cuu',
      sender_role: 'collector',
      sender_name: 'Nhân viên thu gom',
    });
  });

  await batch.commit();
  return { notified: usersSnap.size };
}

async function assertOwnership(sourceType, id, collectorId, collectorName) {
  const collection = sourceType === 'assignment' ? ASSIGNMENTS_COLLECTION : SCHEDULES_COLLECTION;
  const docRef = db.collection(collection).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    const err = new Error('Không tìm thấy lịch/tuyến được yêu cầu.');
    err.status = 404;
    throw err;
  }

  const data = snap.data();
  if (sourceType === 'assignment') {
    if (data.collectorId !== collectorId) {
      const err = new Error('Bạn không có quyền cập nhật tuyến này.');
      err.status = 403;
      throw err;
    }
  } else if (!matchesCollector(data, collectorId, collectorName)) {
    const err = new Error('Bạn không có quyền cập nhật lịch này.');
    err.status = 403;
    throw err;
  }

  return { docRef, data };
}

async function updateItemStatus(collectorId, collectorName, payload) {
  const { sourceType, id, action, imageUrls, incidentType, description } = payload;

  if (!sourceType || !id || !action) {
    const err = new Error('Thiếu thông tin sourceType, id hoặc action.');
    err.status = 400;
    throw err;
  }

  if (!['assignment', 'schedule'].includes(sourceType)) {
    const err = new Error('sourceType không hợp lệ.');
    err.status = 400;
    throw err;
  }

  const { docRef, data } = await assertOwnership(sourceType, id, collectorId, collectorName);
  const currentStatus = normalizeStatus(data.status);
  const now = new Date().toISOString();
  let update = { updated_at: now, updatedAt: now };

  if (action === 'start') {
    if (!STARTABLE.has(currentStatus)) {
      const err = new Error(`Không thể bắt đầu khi trạng thái hiện tại là "${currentStatus}".`);
      err.status = 400;
      throw err;
    }
    update = {
      ...update,
      status: 'in_progress',
      startedAt: now,
      started_at: now,
    };
  } else if (action === 'complete') {
    if (!COMPLETABLE.has(currentStatus)) {
      const err = new Error(`Không thể hoàn thành khi trạng thái hiện tại là "${currentStatus}".`);
      err.status = 400;
      throw err;
    }
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      const err = new Error('Vui lòng upload ít nhất 1 ảnh minh chứng khi hoàn thành.');
      err.status = 400;
      throw err;
    }
    update = {
      ...update,
      status: 'completed',
      completedAt: now,
      completed_at: now,
      evidenceUrls: imageUrls,
      evidence_urls: imageUrls,
    };
  } else if (action === 'incident') {
    const desc = (description || '').trim();
    if (desc.length < 20 || desc.length > 1000) {
      const err = new Error('Mô tả sự cố phải từ 20 đến 1000 ký tự.');
      err.status = 400;
      throw err;
    }
    update = {
      ...update,
      status: 'delayed',
      incident: {
        incidentType: incidentType || 'other',
        description: desc,
        reportedAt: now,
        evidenceUrls: imageUrls || [],
      },
    };
  } else {
    const err = new Error('action không hợp lệ. Dùng start, complete hoặc incident.');
    err.status = 400;
    throw err;
  }

  await docRef.update(update);

  let notificationResult = { notified: 0 };
  if (action === 'incident') {
    const routes = await getRouteMap();
    const route = routes[data.routeId] || {};
    notificationResult = await notifyResidentsScheduleDelayed({
      ward: data.ward || (route.wards || [])[0] || '',
      routeName: data.route_name || route.routeName || '',
      description: description?.trim(),
    });
  }

  const refreshed = await docRef.get();
  return {
    success: true,
    item: { id, sourceType, ...refreshed.data(), status: normalizeStatus(refreshed.data().status) },
    notificationResult,
  };
}

module.exports = {
  getDailySchedules,
  getAllSchedules,
  getAssignmentsInRange,
  getDashboardSummary,
  updateItemStatus,
  getAssignedReports,
  getReportById,
  getReportComments,
  updateReportStatus,
  normalizeStatus,
};

const { db } = require('../config/firebase');

const SCHEDULES_COLLECTION = 'collection_schedules';
const ASSIGNMENTS_COLLECTION = 'route_assignments';

const PENDING_STATUS = 'completed_pending_approval';
const APPROVABLE = new Set([PENDING_STATUS]);
const SKIPPED_STATUSES = new Set(['planned', 'cancelled']);

function normalizeStatus(status) {
  return (status || 'assigned').toLowerCase().replace(/\s+/g, '_');
}

function toDateKey(value) {
  if (!value) return null;
  const d = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function toIsoString(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function mapScheduleItem(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    sourceType: 'schedule',
    route_name: data.route_name || '',
    schedule_date: data.schedule_date,
    date: toDateKey(data.schedule_date),
    status: normalizeStatus(data.status),
    assigned_collector: data.assigned_collector || '',
    assigned_driver: data.assigned_driver || '',
    assigned_truck: data.assigned_truck || '',
    ward: data.ward || '',
    neighborhood: data.neighborhood || '',
    evidence_urls: data.evidence_urls || data.evidenceUrls || [],
    completed_at: toIsoString(data.completed_at || data.completedAt),
    manager_confirmed: Boolean(data.manager_confirmed),
    collector_submitted_at: toIsoString(data.collector_submitted_at || data.completed_at || data.completedAt),
  };
}

function isActiveRoute(status) {
  return !SKIPPED_STATUSES.has(normalizeStatus(status));
}

function isCollectorDone(status) {
  const s = normalizeStatus(status);
  return s === PENDING_STATUS || s === 'completed';
}

async function listPendingCompletions() {
  const snap = await db.collection(SCHEDULES_COLLECTION).get();
  const items = [];
  snap.forEach((doc) => {
    const item = mapScheduleItem(doc);
    if (normalizeStatus(item.status) === PENDING_STATUS) {
      items.push(item);
    }
  });
  items.sort((a, b) => {
    const byDate = (a.date || '').localeCompare(b.date || '');
    if (byDate !== 0) return byDate;
    return (a.route_name || '').localeCompare(b.route_name || '');
  });
  return items;
}

async function getCompletionGroupsByDate() {
  const snap = await db.collection(SCHEDULES_COLLECTION).get();
  const byDate = {};

  snap.forEach((doc) => {
    const item = mapScheduleItem(doc);
    const dateKey = item.date;
    if (!dateKey) return;

    if (!byDate[dateKey]) {
      byDate[dateKey] = {
        date: dateKey,
        total: 0,
        pending: 0,
        approved: 0,
        inProgress: 0,
        delayed: 0,
        routes: [],
      };
    }

    const group = byDate[dateKey];
    const status = normalizeStatus(item.status);

    if (isActiveRoute(status)) {
      group.total += 1;
      if (status === PENDING_STATUS) group.pending += 1;
      else if (status === 'completed' && item.manager_confirmed) group.approved += 1;
      else if (status === 'completed') group.pending += 1;
      else if (status === 'in_progress') group.inProgress += 1;
      else if (status === 'delayed') group.delayed += 1;
    }

    group.routes.push(item);
  });

  return Object.values(byDate)
    .map((group) => {
      const activeRoutes = group.routes.filter((r) => isActiveRoute(r.status));
      const allCollectorDone = activeRoutes.length > 0
        && activeRoutes.every((r) => isCollectorDone(r.status));
      const canApproveDay = allCollectorDone
        && activeRoutes.some((r) => normalizeStatus(r.status) === PENDING_STATUS);

      return {
        ...group,
        activeTotal: activeRoutes.length,
        allCollectorDone,
        canApproveDay,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

async function approveScheduleCompletion(managerId, managerName, scheduleId, payload = {}) {
  const docRef = db.collection(SCHEDULES_COLLECTION).doc(scheduleId);
  const snap = await docRef.get();

  if (!snap.exists) {
    const err = new Error('Không tìm thấy lịch thu gom.');
    err.status = 404;
    throw err;
  }

  const data = snap.data();
  const currentStatus = normalizeStatus(data.status);
  if (!APPROVABLE.has(currentStatus)) {
    const err = new Error(`Chỉ có thể duyệt tuyến ở trạng thái chờ xác nhận (hiện tại: "${currentStatus}").`);
    err.status = 400;
    throw err;
  }

  const now = new Date().toISOString();
  const note = (payload.message || '').trim() || 'Manager đã xác nhận hoàn thành tuyến.';

  await docRef.update({
    status: 'completed',
    manager_confirmed: true,
    manager_approved_at: now,
    manager_approved_by: managerId,
    manager_approved_by_name: managerName,
    manager_approval_note: note,
    updated_at: now,
    updatedAt: now,
  });

  const refreshed = await docRef.get();
  return {
    success: true,
    message: 'Đã xác nhận hoàn thành tuyến.',
    schedule: { id: scheduleId, ...refreshed.data(), status: 'completed' },
  };
}

async function rejectScheduleCompletion(managerId, managerName, scheduleId, payload = {}) {
  const docRef = db.collection(SCHEDULES_COLLECTION).doc(scheduleId);
  const snap = await docRef.get();

  if (!snap.exists) {
    const err = new Error('Không tìm thấy lịch thu gom.');
    err.status = 404;
    throw err;
  }

  const data = snap.data();
  const currentStatus = normalizeStatus(data.status);
  if (!APPROVABLE.has(currentStatus)) {
    const err = new Error(`Chỉ có thể từ chối tuyến ở trạng thái chờ xác nhận (hiện tại: "${currentStatus}").`);
    err.status = 400;
    throw err;
  }

  const reason = (payload.message || '').trim();
  if (reason.length < 10) {
    const err = new Error('Vui lòng nhập lý do từ chối từ 10 ký tự trở lên.');
    err.status = 400;
    throw err;
  }

  const now = new Date().toISOString();
  await docRef.update({
    status: 'in_progress',
    manager_confirmed: false,
    manager_rejected_at: now,
    manager_rejected_by: managerId,
    manager_rejected_by_name: managerName,
    manager_rejection_note: reason,
    updated_at: now,
    updatedAt: now,
  });

  const refreshed = await docRef.get();
  return {
    success: true,
    message: 'Đã từ chối xác nhận. Tuyến trả về trạng thái đang thu gom.',
    schedule: { id: scheduleId, ...refreshed.data(), status: 'in_progress' },
  };
}

async function approveDayCompletions(managerId, managerName, dateStr, payload = {}) {
  if (!dateStr) {
    const err = new Error('Vui lòng cung cấp ngày cần xác nhận.');
    err.status = 400;
    throw err;
  }

  const groups = await getCompletionGroupsByDate();
  const group = groups.find((g) => g.date === dateStr);
  if (!group) {
    const err = new Error('Không có lịch thu gom trong ngày này.');
    err.status = 404;
    throw err;
  }

  if (!group.canApproveDay) {
    const err = new Error('Chưa đủ điều kiện xác nhận: tất cả tuyến trong ngày phải được collector hoàn thành và còn tuyến chờ duyệt.');
    err.status = 400;
    throw err;
  }

  const pendingRoutes = group.routes.filter(
    (r) => isActiveRoute(r.status) && normalizeStatus(r.status) === PENDING_STATUS,
  );

  const note = (payload.message || '').trim() || `Manager xác nhận toàn bộ ${pendingRoutes.length} tuyến ngày ${dateStr}.`;
  const results = [];

  for (const route of pendingRoutes) {
    const result = await approveScheduleCompletion(managerId, managerName, route.id, { message: note });
    results.push(result.schedule);
  }

  return {
    success: true,
    message: `Đã xác nhận ${results.length} tuyến trong ngày ${dateStr}.`,
    approvedCount: results.length,
    schedules: results,
  };
}

module.exports = {
  listPendingCompletions,
  getCompletionGroupsByDate,
  approveScheduleCompletion,
  rejectScheduleCompletion,
  approveDayCompletions,
  normalizeStatus,
  PENDING_STATUS,
};

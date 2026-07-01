const { db } = require('../firebaseAdmin');
const { ROLES } = require('../constants/roles');

const REPORTS_COLLECTION = 'reports';
const REPORT_COMMENTS_COLLECTION = 'report_comments';
const NOTIFICATIONS_COLLECTION = 'notifications';

const APPROVABLE = new Set(['resolved_pending_approval', 'resolved']);

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
    resolutionImageUrls: data.resolutionImageUrls || [],
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
    closedAt: toIsoString(data.closedAt),
  };
}

async function listReports(statusFilter) {
  const snap = await db.collection(REPORTS_COLLECTION).get();
  let reports = snap.docs.map(mapReport);
  if (statusFilter) {
    const target = normalizeStatus(statusFilter);
    reports = reports.filter((r) => normalizeStatus(r.status) === target);
  }
  reports.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  return reports;
}

async function getReportComments(reportId) {
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

async function notifyCitizenReportClosed({ citizenId, title, message }) {
  if (!citizenId) return;
  await db.collection(NOTIFICATIONS_COLLECTION).add({
    user_id: citizenId,
    title: title || 'Phản ánh đã được đóng',
    content: message,
    type: 'system',
    sent_at: new Date(),
    is_read: false,
    link: '/phan-anh',
    sender_role: ROLES.MANAGER,
    sender_name: 'Quản lý khu vực',
  });
}

async function approveReport(managerId, managerName, reportId, payload = {}) {
  const docRef = db.collection(REPORTS_COLLECTION).doc(reportId);
  const snap = await docRef.get();

  if (!snap.exists) {
    const err = new Error('Không tìm thấy phản ánh.');
    err.status = 404;
    throw err;
  }

  const data = snap.data();
  const currentStatus = normalizeStatus(data.status);
  if (!APPROVABLE.has(currentStatus)) {
    const err = new Error(`Chỉ có thể duyệt phản ánh ở trạng thái chờ duyệt (hiện tại: "${currentStatus}").`);
    err.status = 400;
    throw err;
  }

  const now = new Date();
  const trimmedMessage = (payload.message || '').trim() || 'Manager đã duyệt kết quả xử lý.';

  await docRef.update({
    status: 'closed',
    updatedAt: now,
    closedAt: now,
  });

  const commentRef = db.collection(REPORT_COMMENTS_COLLECTION).doc();
  await commentRef.set({
    commentId: commentRef.id,
    reportId,
    userId: managerId,
    role: ROLES.MANAGER,
    message: trimmedMessage,
    imageUrls: [],
    action: 'closed',
    createdAt: now,
  });

  await notifyCitizenReportClosed({
    citizenId: data.citizenId,
    title: 'Phản ánh đã được đóng',
    message: `Phản ánh "${data.title}" đã được quản lý xác nhận hoàn tất. ${trimmedMessage}`,
  });

  const refreshed = await docRef.get();
  return {
    success: true,
    report: mapReport(refreshed),
  };
}

module.exports = {
  listReports,
  getReportComments,
  approveReport,
  mapReport,
  normalizeStatus,
};

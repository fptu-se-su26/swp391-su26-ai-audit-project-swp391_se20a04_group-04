const { admin, db } = require('../config/firebase');
const { normalizeRole } = require('../constants/roles');

const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

/**
 * Lấy danh sách thông báo của một cư dân theo userId.
 * Sắp xếp theo thời gian gửi mới nhất lên đầu.
 * @param {string} userId - UID của cư dân
 * @returns {Array} Danh sách các thông báo
 */
async function getNotifications(userId) {
  const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
  const userRole = userDoc.exists ? normalizeRole(userDoc.data().role) : 'resident';

  const personalSnapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('user_id', '==', userId)
    .get();

  const roleSnapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('targetRole', 'in', ['all', userRole])
    .get();

  const resultsMap = new Map();

  if (!personalSnapshot.empty) {
    personalSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Nếu userRole là manager/admin/collector -> Lọc bỏ các thông báo xác nhận thanh toán cá nhân của cư dân
      if (['manager', 'admin', 'collector'].includes(userRole)) {
        if (data.type === 'payment_success' || data.type === 'payment') {
          if (data.targetRole === 'resident' || !data.targetRole) {
            return;
          }
        }
      }
      resultsMap.set(doc.id, {
        id: doc.id,
        ...data,
        sent_at: data.sent_at?.toDate?.()?.toISOString() || data.sent_at,
      });
    });
  }

  if (!roleSnapshot.empty) {
    roleSnapshot.docs.forEach((doc) => {
      if (!resultsMap.has(doc.id)) {
        const data = doc.data();
        if (['manager', 'admin', 'collector'].includes(userRole)) {
          if (data.type === 'payment_success' || data.type === 'payment') {
            if (data.targetRole === 'resident') {
              return;
            }
          }
        }
        const readBy = data.read_by || [];
        resultsMap.set(doc.id, {
          id: doc.id,
          ...data,
          is_read: readBy.includes(userId),
          sent_at: data.sent_at?.toDate?.()?.toISOString() || data.sent_at,
        });
      }
    });
  }

  const results = Array.from(resultsMap.values());
  return results.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
}

/**
 * Đánh dấu MỘT thông báo là đã đọc.
 * Chỉ cho phép nếu thông báo thuộc về userId đang thực hiện.
 * @param {string} notificationId - ID của document thông báo
 * @param {string} userId - UID của cư dân (xác thực quyền sở hữu)
 */
async function markAsRead(notificationId, userId) {
  const docRef = db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error('Thông báo không tồn tại.');
  }

  const data = doc.data();

  if (data.user_id === userId) {
    await docRef.update({ is_read: true });
  } else if (data.targetRole) {
    await docRef.update({
      read_by: admin.firestore.FieldValue.arrayUnion(userId)
    });
  } else {
    throw new Error('Bạn không có quyền thực hiện hành động này.');
  }
}

/**
 * Đánh dấu TẤT CẢ thông báo của một cư dân là đã đọc.
 * Sử dụng Batch Write để tối ưu hiệu năng.
 * @param {string} userId - UID của cư dân
 */
async function markAllAsRead(userId) {
  const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
  const userRole = userDoc.exists ? normalizeRole(userDoc.data().role) : 'resident';

  const personalSnapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('user_id', '==', userId)
    .where('is_read', '==', false)
    .get();

  const roleSnapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('targetRole', 'in', ['all', userRole])
    .get();

  const batch = db.batch();
  let updatedCount = 0;

  if (!personalSnapshot.empty) {
    personalSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { is_read: true });
      updatedCount++;
    });
  }

  if (!roleSnapshot.empty) {
    roleSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const readBy = data.read_by || [];
      if (!readBy.includes(userId)) {
        batch.update(doc.ref, {
          read_by: admin.firestore.FieldValue.arrayUnion(userId)
        });
        updatedCount++;
      }
    });
  }

  if (updatedCount > 0) {
    await batch.commit();
  }

  return { updated: updatedCount };
}

/**
 * Lấy cấu hình nhận thông báo của một cư dân.
 * @param {string} userId - UID của cư dân
 * @returns {Object} Cấu hình notificationSettings
 */
async function getNotificationSettings(userId) {
  const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();

  // Nếu tài khoản chưa có document trong Firestore (VD: đăng ký lần đầu),
  // trả về cấu hình mặc định thay vì throw lỗi để tránh crash toàn trang
  if (!userDoc.exists) {
    return { email: true, sms: false, push: true };
  }

  return userDoc.data().notificationSettings || {
    email: true,
    sms: false,
    push: true,
  };
}

/**
 * Cập nhật cấu hình nhận thông báo của một cư dân.
 * @param {string} userId - UID của cư dân
 * @param {Object} settings - Cấu hình mới { email, sms, push }
 */
async function updateNotificationSettings(userId, settings) {
  const { email, sms, push } = settings;

  // Xác thực kiểu dữ liệu để tránh ghi sai
  if (typeof email !== 'boolean' || typeof sms !== 'boolean' || typeof push !== 'boolean') {
    throw new Error('Cấu hình nhận thông báo không hợp lệ. Vui lòng kiểm tra lại.');
  }

  await db.collection(USERS_COLLECTION).doc(userId).update({
    notificationSettings: { email, sms, push },
  });
}

/**
 * [ADMIN] Lấy toàn bộ thông báo từ hệ thống.
 */
async function getAdminNotifications(roleFilter) {
  let query = db.collection(NOTIFICATIONS_COLLECTION);
  if (roleFilter && roleFilter !== 'all') {
    query = query.where('targetRole', '==', roleFilter);
  }
  const snapshot = await query.get();
  
  if (snapshot.empty) return [];
  
  const results = snapshot.docs.map(doc => {
    const data = doc.data();
    // Chuyển đổi an toàn kiểu dữ liệu thời gian về ISO String
    let sentAtISO = data.sent_at;
    if (data.sent_at?.toDate) {
      sentAtISO = data.sent_at.toDate().toISOString();
    } else if (data.sent_at instanceof Date) {
      sentAtISO = data.sent_at.toISOString();
    }

    let createdAtISO = data.created_at || sentAtISO;
    if (data.created_at?.toDate) {
      createdAtISO = data.created_at.toDate().toISOString();
    } else if (data.created_at instanceof Date) {
      createdAtISO = data.created_at.toISOString();
    }

    return {
      id: doc.id,
      ...data,
      sent_at: sentAtISO,
      created_at: createdAtISO,
    };
  });

  // Sắp xếp theo thời gian gửi giảm dần (mới nhất lên đầu) bằng JS để tránh composite index
  return results.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
}

/**
 * [ADMIN] Tạo một thông báo mới
 */
async function createAdminNotification(payload) {
  const { title, message, type, targetRole } = payload;
  const newNotification = {
    title,
    content: message,
    type: type || 'system',
    targetRole: targetRole || 'all',
    sent_at: new Date(),
    created_at: new Date().toISOString(),
    is_read: false,
    sender_role: 'admin',
    sender_name: 'Hệ thống Admin',
  };

  const docRef = await db.collection(NOTIFICATIONS_COLLECTION).add(newNotification);
  return { id: docRef.id, ...newNotification };
}

/**
 * [ADMIN] Cập nhật một thông báo
 */
async function updateAdminNotification(id, payload) {
  const { title, message, type, targetRole } = payload;
  const updateData = {
    title,
    content: message,
    type: type || 'system',
    targetRole: targetRole || 'all',
    updated_at: new Date().toISOString(),
  };

  await db.collection(NOTIFICATIONS_COLLECTION).doc(id).update(updateData);
  return { id, ...updateData };
}

/**
 * [ADMIN] Xóa một thông báo
 */
async function deleteAdminNotification(id) {
  await db.collection(NOTIFICATIONS_COLLECTION).doc(id).delete();
  return { id, deleted: true };
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationSettings,
  updateNotificationSettings,
  getAdminNotifications,
  createAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
};

const { db } = require('../firebaseAdmin');

const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

/**
 * Lấy danh sách thông báo của một cư dân theo userId.
 * Sắp xếp theo thời gian gửi mới nhất lên đầu.
 * @param {string} userId - UID của cư dân
 * @returns {Array} Danh sách các thông báo
 */
async function getNotifications(userId) {
  // Lưu ý: Không dùng orderBy kết hợp where để tránh yêu cầu Composite Index trên Firestore.
  // Thay vào đó, sắp xếp kết quả bằng JavaScript sau khi lấy về.
  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('user_id', '==', userId)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const results = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    // Chuyển Firestore Timestamp về ISO string để truyền qua API dễ dàng
    sent_at: doc.data().sent_at?.toDate?.()?.toISOString() || doc.data().sent_at,
  }));

  // Sắp xếp mới nhất lên đầu bằng JavaScript (tránh cần Composite Index trên Firestore)
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

  // Kiểm tra quyền sở hữu: Chỉ chủ nhân mới được đánh dấu
  if (doc.data().user_id !== userId) {
    throw new Error('Bạn không có quyền thực hiện hành động này.');
  }

  await docRef.update({ is_read: true });
}

/**
 * Đánh dấu TẤT CẢ thông báo của một cư dân là đã đọc.
 * Sử dụng Batch Write để tối ưu hiệu năng.
 * @param {string} userId - UID của cư dân
 */
async function markAllAsRead(userId) {
  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('user_id', '==', userId)
    .where('is_read', '==', false)
    .get();

  if (snapshot.empty) {
    return { updated: 0 };
  }

  // Dùng Firestore Batch để ghi nhiều document cùng lúc (tối đa 500/batch)
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { is_read: true });
  });

  await batch.commit();
  return { updated: snapshot.size };
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
 * [SEED] Tạo dữ liệu thông báo mẫu để kiểm thử.
 * Dành cho mục đích phát triển (development). Xóa hoặc bảo vệ route này trước khi deploy production.
 * @param {string} userId - UID của cư dân cần seed dữ liệu
 */
async function seedNotificationsForUser(userId) {
  const sampleNotifications = [
    {
      user_id: userId,
      title: 'Lịch thu gom rác ngày mai',
      content: 'Ngày mai (Thứ Tư) xe sẽ đến thu gom rác hữu cơ. Vui lòng đặt thùng rác màu xanh lá trước cổng trước 7:30 sáng.',
      type: 'schedule',
      sent_at: new Date(),
      is_read: false,
      link: '/tra-cuu',
      sender_role: 'Manager',
      sender_name: 'Công ty Môi Trường Đô Thị Đà Nẵng',
    },
    {
      user_id: userId,
      title: 'Hóa đơn phí vệ sinh tháng 6/2026',
      content: 'Hóa đơn phí vệ sinh môi trường tháng 6/2026 đã được phát hành. Hạn chót thanh toán ngày 25/06/2026. Vui lòng thanh toán đúng hạn.',
      type: 'payment',
      sent_at: new Date(Date.now() - 3600 * 1000 * 5), // 5 giờ trước
      is_read: false,
      link: '/thanh-toan',
      sender_role: 'Admin',
      sender_name: 'Hệ thống EcoSchedule',
    },
    {
      user_id: userId,
      title: 'Cập nhật chính sách phân loại rác mới',
      content: 'Kể từ ngày 01/07/2026, toàn bộ khu vực Quận Sơn Trà sẽ áp dụng chính sách phân loại rác 3 thành phần. Vui lòng xem hướng dẫn để tránh bị từ chối thu gom.',
      type: 'system',
      sent_at: new Date(Date.now() - 3600 * 1000 * 24 * 2), // 2 ngày trước
      is_read: true,
      link: '/huong-dan',
      sender_role: 'Admin',
      sender_name: 'Hệ thống EcoSchedule',
    },
    {
      user_id: userId,
      title: 'Thông báo: Xe rác đến muộn hôm nay',
      content: 'Do ảnh hưởng của mưa lớn, lịch thu gom rác chiều hôm nay tại Tổ 5 - Phường Mân Thái sẽ bị dời sang 18:00 - 20:00. Xin lỗi vì bất tiện này!',
      type: 'schedule',
      sent_at: new Date(Date.now() - 3600 * 1000 * 2), // 2 giờ trước
      is_read: false,
      link: '/tra-cuu',
      sender_role: 'Manager',
      sender_name: 'Công ty Môi Trường Đô Thị Đà Nẵng',
    },
  ];

  const batch = db.batch();
  sampleNotifications.forEach((notification) => {
    const docRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
    batch.set(docRef, notification);
  });

  await batch.commit();
  return { seeded: sampleNotifications.length };
}

/**
 * Lấy toàn bộ thông báo đã phát đi bởi Admin
 */
async function getAdminNotifications() {
  const snapshot = await db.collection('admin_notifications').get();
  if (snapshot.empty) return [];
  const results = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    sent_at: doc.data().sent_at?.toDate?.()?.toISOString() || doc.data().sent_at,
  }));
  return results.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
}

/**
 * Tạo thông báo tổng hoặc đến từng role riêng lẻ
 */
async function createAdminNotification({ title, content, type, recipientType, link, senderName }) {
  if (!title || !content || !type || !recipientType) {
    throw new Error('Thiếu thông tin bắt buộc để tạo thông báo.');
  }

  const sentAt = new Date();
  
  const masterData = {
    title,
    content,
    type,
    recipient_type: recipientType,
    link: link || '',
    sender_name: senderName || 'Hệ thống EcoSchedule',
    sender_role: 'Admin',
    sent_at: sentAt,
  };
  
  const masterDocRef = await db.collection('admin_notifications').add(masterData);
  const masterId = masterDocRef.id;

  let userQuery = db.collection(USERS_COLLECTION);
  if (recipientType !== 'all') {
    const targetRoles = [recipientType];
    if (recipientType === 'Garbage Collector') targetRoles.push('collector');
    if (recipientType === 'Collection Company Manager') targetRoles.push('manager');
    if (recipientType === 'Citizen') targetRoles.push('resident');
    if (recipientType === 'Admin') targetRoles.push('admin');
    
    userQuery = userQuery.where('role', 'in', targetRoles);
  }
  
  const usersSnapshot = await userQuery.get();
  if (usersSnapshot.empty) {
    return { masterId, sentCount: 0 };
  }

  const batch = db.batch();
  usersSnapshot.docs.forEach(userDoc => {
    const userNotifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
    batch.set(userNotifRef, {
      user_id: userDoc.id,
      master_id: masterId,
      title,
      content,
      type,
      is_read: false,
      link: link || '',
      sender_name: senderName || 'Hệ thống EcoSchedule',
      sender_role: 'Admin',
      sent_at: sentAt,
    });
  });

  await batch.commit();
  return { masterId, sentCount: usersSnapshot.size };
}

/**
 * Xóa thông báo của Admin và tất cả các bản sao đã gửi cho User
 */
async function deleteAdminNotification(masterId) {
  await db.collection('admin_notifications').doc(masterId).delete();

  const userNotificationsSnapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('master_id', '==', masterId)
    .get();

  if (!userNotificationsSnapshot.empty) {
    const batch = db.batch();
    userNotificationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
  return { success: true };
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationSettings,
  updateNotificationSettings,
  seedNotificationsForUser,
  getAdminNotifications,
  createAdminNotification,
  deleteAdminNotification,
};

const { db } = require('../firebaseAdmin');

/**
 * Tạo phản ánh mới của cư dân.
 * @param {string} userId - UID của cư dân
 * @param {string} userName - Họ tên cư dân
 * @param {Object} complaintData - Dữ liệu phản ánh { title, description, type, city, ward, neighborhood }
 * @returns {Object} Bản ghi phản ánh đã lưu kèm ID
 */
async function createComplaint(userId, userName, complaintData) {
  const { title, description, type, city, ward, neighborhood } = complaintData;

  if (!title || !title.trim()) {
    throw new Error('Tiêu đề phản ánh không được để trống.');
  }
  if (!description || !description.trim()) {
    throw new Error('Nội dung phản ánh không được để trống.');
  }
  if (!type || !type.trim()) {
    throw new Error('Loại phản ánh không hợp lệ.');
  }

  const newComplaint = {
    userId,
    userName: userName || 'Cư dân',
    title: title.trim(),
    description: description.trim(),
    type: type.trim(),
    city: city || '',
    ward: ward || '',
    neighborhood: neighborhood || '',
    status: 'Open', // Trạng thái ban đầu: Open
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    reply: '', // Admin phản hồi sau này
    replied_by: '',
    replied_at: null,
  };

  const docRef = await db.collection('complaints').add(newComplaint);
  return { id: docRef.id, ...newComplaint };
}

/**
 * Lấy danh sách phản ánh cư dân đã gửi.
 * Sắp xếp theo thứ tự mới nhất lên đầu.
 * @param {string} userId - UID của cư dân
 * @returns {Array} Danh sách các phản ánh
 */
async function getUserComplaints(userId) {
  const snapshot = await db.collection('complaints')
    .where('userId', '==', userId)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const complaints = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sắp xếp theo thời gian tạo mới nhất lên đầu bằng JS để tránh composite index
  complaints.sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  return complaints;
}

/**
 * Lấy toàn bộ danh sách phản ánh (dành cho Manager).
 * Sắp xếp theo thứ tự mới nhất lên đầu.
 * @returns {Array} Danh sách tất cả phản ánh
 */
async function getAllComplaints() {
  const snapshot = await db.collection('complaints').get();

  if (snapshot.empty) {
    return [];
  }

  const complaints = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sắp xếp theo thời gian tạo mới nhất lên đầu
  complaints.sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  return complaints;
}

/**
 * Cập nhật trạng thái phản ánh bởi Manager.
 * @param {string} complaintId - ID của phản ánh
 * @param {string} managerId - UID của manager
 * @param {string} managerName - Tên manager
 * @param {Object} updateData - { status, comment }
 *   status: 'in_resolve' | 'resolved' | 'rejected'
 *   comment: Lý do từ chối hoặc nhận xét
 * @returns {Object} Phản ánh đã cập nhật
 */
async function updateComplaintStatus(complaintId, managerId, managerName, updateData) {
  const { status, comment } = updateData;

  const validStatuses = ['in_resolve', 'resolved', 'rejected'];
  if (!status || !validStatuses.includes(status)) {
    throw new Error('Trạng thái không hợp lệ. Chỉ chấp nhận: in_resolve, resolved, rejected.');
  }

  if (status === 'rejected' && (!comment || !comment.trim())) {
    throw new Error('Vui lòng nhập lý do từ chối phản ánh.');
  }

  const docRef = db.collection('complaints').doc(complaintId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new Error('Không tìm thấy phản ánh với ID đã cung cấp.');
  }

  const now = new Date().toISOString();
  const updateFields = {
    status,
    reply: (comment || '').trim(),
    replied_by: managerName || managerId,
    replied_at: now,
    updated_at: now,
  };

  await docRef.update(updateFields);

  return { id: complaintId, ...docSnap.data(), ...updateFields };
}

module.exports = {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaintStatus,
};

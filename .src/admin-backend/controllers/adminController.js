const { db, auth } = require('../config/firebase');
const { ROLES, normalizeRole } = require('../constants/roles');
const { normalizeUser } = require('../helpers/normalizeUser');
const notificationService = require('../services/notificationService');

const USERS_COLLECTION = 'users';

/**
 * GET /api/admin/users
 */
async function getUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limitNum = parseInt(req.query.limit) || 10;
    const { role = '', search = '' } = req.query;

    let query = db.collection(USERS_COLLECTION);
    
    // Áp dụng bộ lọc (Không dùng orderBy chung với where để tránh lỗi Composite Index)
    let hasFilter = false;
    
    if (search) {
      query = query.where('email', '>=', search).where('email', '<=', search + '\uf8ff');
      hasFilter = true;
    } else if (role && role !== 'all') {
      query = query.where('role', '==', role);
      hasFilter = true;
    }
    
    // Nếu không có filter thì mới sắp xếp theo createdAt
    if (!hasFilter) {
      query = query.orderBy('createdAt', 'desc');
    }

    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    const snapshot = await query.offset((page - 1) * limitNum).limit(limitNum).get();
    
    let users = snapshot.docs.map(doc => {
      const u = normalizeUser(doc.data(), doc.id);
      u.createdAt = doc.data().createdAt || '';
      return u;
    });

    return res.json({
      data: users,
      total,
      page,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('[Admin] Lỗi lấy danh sách user:', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách người dùng.' });
  }
}

/**
 * POST /api/admin/users
 */
async function createUser(req, res) {
  try {
    const { email, password, fullName, phone, role, area, address } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (Email, Mật khẩu, Họ tên)' });
    }
    
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: true,
    });

    const userData = {
      uid: userRecord.uid,
      email,
      fullName,
      phone: phone || '',
      role: role || ROLES.RESIDENT,
      area: area || '',
      address: address || '',
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };

    await db.collection(USERS_COLLECTION).doc(userRecord.uid).set(userData);
    res.status(201).json(normalizeUser(userData, userRecord.uid));
  } catch (error) {
    console.error('[Admin] Lỗi tạo user:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi tạo người dùng mới.' });
  }
}

/**
 * PUT /api/admin/users/:uid
 */
async function updateUser(req, res) {
  try {
    const { uid } = req.params;
    const { fullName, phone, role, area, address } = req.body;

    await auth.updateUser(uid, {
      displayName: fullName,
    });

    const updateData = {
      fullName,
      phone: phone || '',
      role: role || ROLES.RESIDENT,
      area: area || '',
      address: address || '',
      updatedAt: new Date().toISOString()
    };

    await db.collection(USERS_COLLECTION).doc(uid).update(updateData);
    
    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    res.json(normalizeUser(userDoc.data(), uid));
  } catch (error) {
    console.error('[Admin] Lỗi sửa user:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi cập nhật người dùng.' });
  }
}

/**
 * DELETE /api/admin/users/:uid
 */
async function deleteUser(req, res) {
  try {
    const { uid } = req.params;
    await auth.deleteUser(uid);
    await db.collection(USERS_COLLECTION).doc(uid).delete();
    res.json({ message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    console.error('[Admin] Lỗi xóa user:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi xóa người dùng.' });
  }
}

/**
 * GET /api/admin/transactions
 */
async function getTransactions(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limitNum = parseInt(req.query.limit) || 10;
    const { role = '' } = req.query;

    // 1. Fetch payments (limit to a reasonable max like 2000 to prevent OOM)
    const paymentsSnapshot = await db.collection('payments').limit(2000).get();
    let payments = [];
    paymentsSnapshot.forEach(doc => {
      payments.push({ id: doc.id, ...doc.data() });
    });

    const getTime = (dateVal) => {
      if (!dateVal) return 0;
      if (typeof dateVal === 'string') return new Date(dateVal).getTime();
      if (dateVal.toDate) return dateVal.toDate().getTime(); // Firestore Timestamp
      if (dateVal._seconds) return dateVal._seconds * 1000;
      if (dateVal.seconds) return dateVal.seconds * 1000;
      return new Date(dateVal).getTime();
    };

    // 2. Sort payments by time descending
    payments.sort((a, b) => {
      const timeA = getTime(a.createdAt || a.paidAt);
      const timeB = getTime(b.createdAt || b.paidAt);
      return timeB - timeA;
    });

    let usersMap = {};
    let filteredPayments = [];

    // 3. Filter by role if provided
    if (role && role !== 'all') {
      const roleUsersSnapshot = await db.collection(USERS_COLLECTION).where('role', '==', role).get();
      roleUsersSnapshot.forEach(doc => {
        const u = normalizeUser(doc.data(), doc.id);
        usersMap[doc.id] = {
          fullName: u.fullName,
          email: u.email,
          role: normalizeRole(u.role),
        };
      });
      const targetUserIds = new Set(Object.keys(usersMap));
      filteredPayments = payments.filter(pm => targetUserIds.has(pm.userId));
    } else {
      filteredPayments = payments;
    }

    const total = filteredPayments.length;
    
    // 4. Paginate
    const paginatedPayments = filteredPayments.slice((page - 1) * limitNum, page * limitNum);

    // 5. Fetch user info only for the paginated payments (if not already fetched)
    const userIdsToFetch = [...new Set(paginatedPayments.map(pm => pm.userId).filter(id => id && !usersMap[id]))];
    
    if (userIdsToFetch.length > 0) {
      const refs = userIdsToFetch.map(id => db.collection(USERS_COLLECTION).doc(id));
      for (let i = 0; i < refs.length; i += 100) {
        const chunkRefs = refs.slice(i, i + 100);
        const userDocs = await db.getAll(...chunkRefs);
        userDocs.forEach(doc => {
          if (doc.exists) {
            const u = normalizeUser(doc.data(), doc.id);
            usersMap[doc.id] = {
              fullName: u.fullName,
              email: u.email,
              role: normalizeRole(u.role),
            };
          }
        });
      }
    }

    // 6. Map to final output
    const transactions = paginatedPayments.map(pm => {
      const user = usersMap[pm.userId] || {};
      return {
        ...pm,
        transactionId: pm.transactionCode || pm.paymentId || pm.id,
        userName: user.fullName || 'Ẩn danh',
        userEmail: user.email || '',
        userRole: user.role || 'Resident',
      };
    });

    return res.status(200).json({ 
      data: transactions,
      total,
      page,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('[Admin] Lỗi lấy danh sách giao dịch:', error);
    return res.status(500).json({ error: 'Lỗi khi tải lịch sử giao dịch.' });
  }
}

/**
 * GET /api/admin/complaints
 */
async function getComplaints(req, res) {
  try {
    const snapshot = await db.collection('complaints').orderBy('created_at', 'desc').limit(1000).get();
    let complaints = [];
    snapshot.forEach(doc => complaints.push({ id: doc.id, ...doc.data() }));

    const userIds = [...new Set(complaints.map(c => c.userId).filter(Boolean))];
    const usersMap = {};
    if (userIds.length > 0) {
      const refs = userIds.map(id => db.collection(USERS_COLLECTION).doc(id));
      for (let i = 0; i < refs.length; i += 100) {
        const chunkRefs = refs.slice(i, i + 100);
        const userDocs = await db.getAll(...chunkRefs);
        userDocs.forEach(doc => {
          if (doc.exists) {
            const u = normalizeUser(doc.data(), doc.id);
            usersMap[doc.id] = normalizeRole(u.role);
          }
        });
      }
    }

    complaints = complaints.map(c => ({
      ...c,
      userRole: usersMap[c.userId] || 'Unknown'
    }));

    return res.json({
      data: complaints,
      total: complaints.length
    });
  } catch (error) {
    console.error('[Admin] Lỗi lấy danh sách phản ánh:', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách phản ánh.' });
  }
}

/**
 * GET /api/notifications/admin
 */
async function getAdminNotifications(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limitNum = parseInt(req.query.limit) || 10;
    const { role } = req.query;
    const notifications = await notificationService.getAdminNotifications(role, page, limitNum);
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('[API] Lỗi lấy danh sách thông báo admin:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/notifications/admin
 */
async function createAdminNotification(req, res) {
  try {
    const result = await notificationService.createAdminNotification(req.body);
    return res.status(201).json(result);
  } catch (error) {
    console.error('[API] Lỗi tạo thông báo admin:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/notifications/admin/:id
 */
async function updateAdminNotification(req, res) {
  try {
    const result = await notificationService.updateAdminNotification(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[API] Lỗi cập nhật thông báo admin:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/notifications/admin/:id
 */
async function deleteAdminNotification(req, res) {
  try {
    const result = await notificationService.deleteAdminNotification(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[API] Lỗi xóa thông báo admin:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getTransactions,
  getComplaints,
  getAdminNotifications,
  createAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
};

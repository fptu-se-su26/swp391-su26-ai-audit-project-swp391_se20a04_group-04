const { db } = require('../config/firebase');
const { ROLES, normalizeRole } = require('../constants/roles');
const { normalizeUser } = require('../helpers/normalizeUser');

const USERS_COLLECTION = 'users';

/**
 * Middleware cho phép truy cập chỉ với vai trò Manager
 */
async function ensureManager(req, res, next) {
  try {
    let userDoc = await db.collection(USERS_COLLECTION).doc(req.uid).get();
    if (!userDoc.exists) {
      userDoc = await db.collection('users').doc(req.uid).get();
    }
    if (!userDoc.exists) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin người dùng để xác thực vai trò.' });
    }

    const userData = normalizeUser(userDoc.data(), req.uid);
    const role = normalizeRole(userData.role);
    if (role !== ROLES.MANAGER && role !== ROLES.ADMIN) {
      return res.status(403).json({ error: 'Chỉ có Collection Company Manager hoặc Admin mới được phép truy cập chức năng này.' });
    }

    req.userProfile = userData;
    next();
  } catch (error) {
    console.error('[Auth] Lỗi kiểm tra vai trò Manager:', error.message);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xác thực vai trò manager.' });
  }
}

/**
 * Middleware cho phép truy cập chỉ với vai trò Collector
 */
async function ensureCollector(req, res, next) {
  try {
    const userDoc = await db.collection(USERS_COLLECTION).doc(req.uid).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin người dùng để xác thực vai trò.' });
    }

    const userData = normalizeUser(userDoc.data(), req.uid);
    const role = normalizeRole(userData.role);
    if (role !== ROLES.COLLECTOR) {
      return res.status(403).json({ error: 'Chỉ có nhân viên thu gom mới được phép xác nhận tuyến.' });
    }

    req.userProfile = userData;
    next();
  } catch (error) {
    console.error('[Auth] Lỗi kiểm tra vai trò Collector:', error.message);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xác thực vai trò collector.' });
  }
}

/**
 * Middleware cho phép truy cập chỉ với vai trò Resident
 */
async function ensureResident(req, res, next) {
  try {
    const userDoc = await db.collection(USERS_COLLECTION).doc(req.uid).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin người dùng để xác thực vai trò.' });
    }

    const userData = normalizeUser(userDoc.data(), req.uid);
    const role = normalizeRole(userData.role);
    if (role !== ROLES.RESIDENT) {
      return res.status(403).json({ error: 'Chỉ cư dân mới được phép truy cập chức năng này.' });
    }

    req.userProfile = userData;
    next();
  } catch (error) {
    console.error('[Auth] Lỗi kiểm tra vai trò Resident:', error.message);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xác thực vai trò resident.' });
  }
}

/**
 * Middleware cho phép truy cập chỉ với vai trò Admin
 */
async function ensureAdmin(req, res, next) {
  try {
    const userDoc = await db.collection(USERS_COLLECTION).doc(req.uid).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin người dùng để xác thực vai trò.' });
    }

    const userData = normalizeUser(userDoc.data(), req.uid);
    const role = normalizeRole(userData.role);
    if (role !== ROLES.ADMIN) {
      return res.status(403).json({ error: 'Chỉ Admin mới được phép truy cập chức năng này.' });
    }

    req.userProfile = userData;
    next();
  } catch (error) {
    console.error('[Auth] Lỗi kiểm tra vai trò Admin:', error.message);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xác thực vai trò admin.' });
  }
}

module.exports = { ensureManager, ensureCollector, ensureResident, ensureAdmin };

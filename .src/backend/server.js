// Trigger reload of .env configuration
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { db, auth } = require('./firebaseAdmin');
const { ROLES, normalizeRole } = require('./constants/roles');
const addressService = require('./services/addressService');
const scheduleService = require('./services/scheduleService');
const notificationService = require('./services/notificationService');
const invoiceService = require('./services/invoiceService');
const complaintService = require('./services/complaintService');
const collectorService = require('./services/collectorService');
const reportService = require('./services/reportService');

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || '';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';
const PAYOS_API_BASE_URL = (process.env.PAYOS_API_BASE_URL && !process.env.PAYOS_API_BASE_URL.includes('example.com'))
  ? process.env.PAYOS_API_BASE_URL
  : 'https://api-merchant.payos.vn';

// CORS configuration - Allow frontend server
const allowedOrigins = [
  'https://swp391-database.web.app',
  'https://swp391-database.firebaseapp.com',
  'https://ecoschedule.online',       // custom domain
  'https://www.ecoschedule.online',   // custom domain (www)
  process.env.FRONTEND_URL,          // tuỳ chỉnh qua biến môi trường
  'http://localhost:5173',            // Vite dev server
  'http://localhost:5001',            // local backend (same-origin)
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Cho phép request không có origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
}));


app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Tên collection chính trên Firestore
const USERS_COLLECTION = 'users';


/**
 * Chuẩn hóa dữ liệu user từ Firestore
 */
function normalizeUser(data, uid) {
  return {
    uid:      data.uid      || uid,
    fullName: data.fullName || data['Họ và tên']   || data['ho_va_ten'] || '',
    email:    data.email    || data['e-mail']       || data['Email']     || '',
    phone:    data.phone    || data['điện thoại']   || data['dien_thoai']|| '',
    address:  data.address  || data['Địa chỉ']      || data['dia_chi']   || '',
    area:     data.area     || data['khu vực']      || data['khu_vuc']   || '',
    role:     normalizeRole(data.role || data['vai trò'] || data['Vai trò']),
    emailVerified: data.emailVerified ?? true,
  };
}


/**
 * Endpoint Đăng ký tài khoản
 */
app.post('/api/auth/register', async (req, res) => {
  // Lưu ý: trường `role` từ client bị bỏ qua hoàn toàn vì lý do bảo mật.
  // Mọi tài khoản đăng ký mới luôn được gán vai trò RESIDENT.
  // Admin mới có quyền thay đổi vai trò qua trang Quản lý người dùng.
  const { fullName, email, phone, password, address } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin (Họ và tên, Email, Mật khẩu)' });
  }

  try {
    console.log(`[Register] Đang tạo tài khoản cho email: ${email}`);

    // 1. Đăng ký user thông qua Firebase Auth REST API (để tự động liên kết với client config)
    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
    const signUpResponse = await fetch(signUpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const signUpData = await signUpResponse.json();

    if (!signUpResponse.ok) {
      const errorMsg = signUpData.error?.message || 'Đăng ký thất bại';
      console.error('[Register] Lỗi từ Firebase Auth REST:', errorMsg);
      
      if (errorMsg === 'EMAIL_EXISTS') {
        return res.status(400).json({ error: 'Email này đã được sử dụng. Vui lòng dùng email khác.' });
      }
      if (errorMsg.includes('WEAK_PASSWORD')) {
        return res.status(400).json({ error: 'Mật khẩu quá yếu. Vui lòng dùng mật khẩu ít nhất 6 ký tự.' });
      }
      if (errorMsg.includes('INVALID_EMAIL')) {
        return res.status(400).json({ error: 'Địa chỉ email không hợp lệ.' });
      }
      return res.status(400).json({ error: errorMsg });
    }

    const uid = signUpData.localId;
    const idToken = signUpData.idToken;

    // 2. Gửi email xác nhận bằng REST API (sử dụng OobCode của Firebase)
    console.log(`[Register] Đang gửi email xác nhận cho: ${email}`);
    const sendOobUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`;
    const sendOobResponse = await fetch(sendOobUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'VERIFY_EMAIL', idToken }),
    });

    if (!sendOobResponse.ok) {
      const oobError = await sendOobResponse.json();
      console.warn('[Register] Cảnh báo: Không gửi được email xác nhận:', oobError.error?.message);
    }

    // 3. Chuẩn bị dữ liệu để ghi vào Firestore bằng Admin SDK
    const userData = {
      uid,
      fullName,
      email,
      phone: phone || '',
      address: address || '',
      role: ROLES.RESIDENT,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      area: 'Quận Sơn Trà, Đà Nẵng',
    };

    // Ghi nhận đồng thời vào hai collection ('người dùng' và 'users') để tương thích với tất cả trang
    // Vì đang chạy ở Backend sử dụng Firebase Admin SDK, thao tác này vượt qua mọi rules bảo mật client!
    console.log(`[Register] Đang lưu thông tin tài khoản ${uid} vào Firestore database...`);
    await db.collection(USERS_COLLECTION).doc(uid).set(userData);

    console.log(`[Register] Đăng ký thành công cho user: ${email} (${uid})`);
    return res.status(201).json({ success: true });

  } catch (error) {
    console.error('[Register] Lỗi hệ thống khi đăng ký:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống khi đăng ký tài khoản. Vui lòng thử lại sau.' });
  }
});

/**
 * Endpoint Đăng nhập
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp Email và Mật khẩu' });
  }

  try {
    console.log(`[Login] Đang đăng nhập email: ${email}`);

    // 1. Xác thực thông tin đăng nhập qua Firebase Auth REST API
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    const signInResponse = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const signInData = await signInResponse.json();

    if (!signInResponse.ok) {
      const errorMsg = signInData.error?.message || 'Đăng nhập thất bại';
      console.error('[Login] Lỗi xác thực từ Firebase Auth REST:', errorMsg);

      if (errorMsg === 'INVALID_LOGIN_CREDENTIALS' || errorMsg === 'EMAIL_NOT_FOUND' || errorMsg === 'INVALID_PASSWORD') {
        return res.status(400).json({ error: 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.' });
      }
      if (errorMsg === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        return res.status(400).json({ error: 'Tài khoản bị tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.' });
      }
      return res.status(400).json({ error: errorMsg });
    }

    const uid = signInData.localId;
    const idToken = signInData.idToken;

    // 2. Lấy thông tin chi tiết user từ Firebase Admin Auth để kiểm tra emailVerified
    const userRecord = await auth.getUser(uid);

    if (!userRecord.emailVerified) {
      console.log(`[Login] Email ${email} chưa xác nhận, từ chối đăng nhập.`);
      return res.status(403).json({
        error: 'Email của bạn chưa được xác nhận. Vui lòng kiểm tra hộp thư và nhấp vào đường link xác nhận trước khi đăng nhập.'
      });
    }

    // 3. Lấy thông tin người dùng từ Firestore bằng Admin SDK (bảo mật tuyệt đối)
    console.log(`[Login] Đang tải thông tin Firestore của user ${uid}`);
    let userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();

    let userData = {};
    if (userDoc.exists) {
      userData = normalizeUser(userDoc.data(), uid);
      
      // Cập nhật trạng thái emailVerified lên true trong Firestore nếu chưa đồng bộ
      if (!userDoc.data().emailVerified) {
        await db.collection(USERS_COLLECTION).doc(uid).update({ emailVerified: true });
        userData.emailVerified = true;
      }
    } else {
      // Dự phòng nếu không có trong Firestore (ví dụ admin tạo thủ công từ Auth)
      userData = {
        uid: uid,
        fullName: userRecord.displayName || email.split('@')[0],
        email: email,
        role: ROLES.RESIDENT,
        area: 'Quận Sơn Trà, Đà Nẵng',
        emailVerified: true,
      };
    }

    console.log(`[Login] Đăng nhập thành công: ${email}`);
    return res.status(200).json({
      user: userData,
      token: idToken
    });

  } catch (error) {
    console.error('[Login] Lỗi hệ thống khi đăng nhập:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống khi đăng nhập. Vui lòng thử lại sau.' });
  }
});

/**
 * Endpoint đăng nhập bằng Google
 */
app.post('/api/auth/google-login', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'Missing idToken for Google login.' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email || '';
    const emailVerified = decodedToken.email_verified ?? true;

    console.log(`[GoogleLogin] Verifying Google token for uid: ${uid}`);

    const userRecord = await auth.getUser(uid);

    let userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();

    let userData = {};
    if (userDoc.exists) {
      userData = normalizeUser(userDoc.data(), uid);
      if (!userDoc.data().emailVerified && emailVerified) {
        await db.collection(USERS_COLLECTION).doc(uid).update({ emailVerified: true });
        userData.emailVerified = true;
      }
    } else {
      userData = {
        uid,
        fullName: userRecord.displayName || email.split('@')[0],
        email,
        phone: userRecord.phoneNumber || '',
        address: '',
        role: ROLES.RESIDENT,
        area: 'Quận Sơn Trà, Đà Nẵng',
        emailVerified,
        createdAt: new Date().toISOString(),
      };

      await db.collection(USERS_COLLECTION).doc(uid).set(userData);
    }

    console.log(`[GoogleLogin] Đăng nhập Google thành công: ${email}`);
    return res.status(200).json({ user: userData, token: idToken });
  } catch (error) {
    console.error('[GoogleLogin] Lỗi hệ thống khi đăng nhập bằng Google:', error);
    if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-expired' || error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid Google token. Please sign in again.' });
    }
    return res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống khi đăng nhập bằng Google. Vui lòng thử lại sau.' });
  }
});

/**
 * Endpoint lấy danh sách Tỉnh/Thành phố
 */
app.get('/api/address/provinces', async (req, res) => {
  try {
    const provinces = await addressService.getProvinces();
    return res.status(200).json(provinces);
  } catch (error) {
    console.error('[API] Lỗi lấy danh sách tỉnh thành:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint lấy danh sách Phường/Xã theo mã Tỉnh/Thành phố
 */
app.get('/api/address/wards', async (req, res) => {
  const { provinceCode } = req.query;
  if (!provinceCode) {
    return res.status(400).json({ error: 'Thiếu mã Tỉnh/Thành phố (provinceCode).' });
  }
  try {
    const wards = await addressService.getWardsByProvince(provinceCode);
    return res.status(200).json(wards);
  } catch (error) {
    console.error(`[API] Lỗi lấy danh sách phường xã cho tỉnh ${provinceCode}:`, error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint tra cứu lịch thu gom rác theo khu vực
 */
app.get('/api/schedules', async (req, res) => {
  const { city, ward, neighborhood } = req.query;
  if (!city || !ward) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ Tỉnh/Thành phố và Phường/Xã để tra cứu.' });
  }
  try {
    const schedules = await scheduleService.getSchedules({ city, ward, neighborhood });
    return res.status(200).json(schedules);
  } catch (error) {
    console.error('[API] Lỗi tra cứu lịch thu gom:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

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

// ----------------------------------------------------------------------
// ADMIN APIS: USER MANAGEMENT
// ----------------------------------------------------------------------

app.get('/api/admin/users', verifyToken, ensureAdmin, async (req, res) => {
  try {
    // Tải toàn bộ user (giới hạn 1000 để an toàn RAM) cho frontend tự lọc và phân trang
    const snapshot = await db.collection(USERS_COLLECTION).orderBy('createdAt', 'desc').limit(1000).get();
    let users = snapshot.docs.map(doc => {
      const u = normalizeUser(doc.data(), doc.id);
      u.createdAt = doc.data().createdAt || '';
      return u;
    });

    return res.json({
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error('[Admin] Lỗi lấy danh sách user:', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách người dùng.' });
  }
});

app.post('/api/admin/users', verifyToken, ensureAdmin, async (req, res) => {
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
});

app.put('/api/admin/users/:uid', verifyToken, ensureAdmin, async (req, res) => {
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
});

app.delete('/api/admin/users/:uid', verifyToken, ensureAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    await auth.deleteUser(uid);
    await db.collection(USERS_COLLECTION).doc(uid).delete();
    res.json({ message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    console.error('[Admin] Lỗi xóa user:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi xóa người dùng.' });
  }
});

app.get('/api/admin/transactions', verifyToken, ensureAdmin, async (req, res) => {
  try {
    const { role = '' } = req.query;

    const paymentsSnapshot = await db.collection('payments').get();
    const payments = [];
    paymentsSnapshot.forEach(doc => {
      payments.push({ id: doc.id, ...doc.data() });
    });

    const userIds = [...new Set(payments.map(pm => pm.userId).filter(Boolean))];
    const usersMap = {};
    if (userIds.length > 0) {
      const refs = userIds.map(id => db.collection(USERS_COLLECTION).doc(id));
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

    let transactions = payments.map(pm => {
      const user = usersMap[pm.userId] || {};
      return {
        ...pm,
        transactionId: pm.transactionCode || pm.paymentId || pm.id,
        userName: user.fullName || 'Ẩn danh',
        userEmail: user.email || '',
        userRole: user.role || 'Resident',
      };
    });

    if (role) {
      transactions = transactions.filter(t => t.userRole === role);
    }
    const getTime = (dateVal) => {
      if (!dateVal) return 0;
      if (typeof dateVal === 'string') return new Date(dateVal).getTime();
      if (dateVal.toDate) return dateVal.toDate().getTime(); // Firestore Timestamp
      if (dateVal._seconds) return dateVal._seconds * 1000;
      if (dateVal.seconds) return dateVal.seconds * 1000;
      return new Date(dateVal).getTime();
    };

    transactions.sort((a, b) => {
      const timeA = getTime(a.createdAt || a.paidAt);
      const timeB = getTime(b.createdAt || b.paidAt);
      return timeB - timeA;
    });

    return res.status(200).json({ data: transactions });
  } catch (error) {
    console.error('[Admin] Lỗi lấy danh sách giao dịch:', error);
    return res.status(500).json({ error: 'Lỗi khi tải lịch sử giao dịch.' });
  }
});

app.get('/api/admin/complaints', verifyToken, ensureAdmin, async (req, res) => {
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
});



app.get('/api/manager/collectors', verifyToken, ensureManager, async (req, res) => {
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
});

app.get('/api/manager/schedules', verifyToken, ensureManager, async (req, res) => {
  try {
    const snapshot = await db.collection('collection_schedules').orderBy('schedule_date', 'asc').get();
    const schedules = [];
    snapshot.forEach((doc) => schedules.push({ id: doc.id, ...doc.data() }));
    return res.status(200).json(schedules);
  } catch (error) {
    console.error('[API] Lỗi lấy lịch quản lý:', error.message);
    return res.status(500).json({ error: 'Không thể tải danh sách lịch cho Manager.' });
  }
});

app.post('/api/manager/schedules', verifyToken, ensureManager, async (req, res) => {
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
});

app.post('/api/manager/assign-route', verifyToken, ensureManager, async (req, res) => {
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
});

app.post('/api/manager/confirm-route', verifyToken, ensureManager, async (req, res) => {
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
});

app.get('/api/dashboard/collector', verifyToken, ensureCollector, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const data = await collectorService.getDashboardSummary(
      req.uid,
      req.userProfile.fullName,
      date,
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[API] Lỗi dashboard collector:', error.message);
    return res.status(500).json({ error: 'Không thể tải dashboard collector.' });
  }
});

app.get('/api/collector/schedules', verifyToken, ensureCollector, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const result = await collectorService.getDailySchedules(
      req.uid,
      req.userProfile.fullName,
      date,
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[API] Lỗi lấy lịch collector:', error.message);
    return res.status(500).json({ error: 'Không thể tải lịch làm việc.' });
  }
});

app.get('/api/route-assignments/my', verifyToken, ensureCollector, async (req, res) => {
  try {
    const from = req.query.from || req.query.date || new Date().toISOString().slice(0, 10);
    const to = req.query.to || from;
    const data = await collectorService.getAssignmentsInRange(req.uid, from, to);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[API] Lỗi lấy route assignments:', error.message);
    return res.status(500).json({ error: 'Không thể tải tuyến được gán.' });
  }
});

app.patch('/api/collector/schedules/:sourceType/:id/status', verifyToken, ensureCollector, async (req, res) => {
  const { sourceType, id } = req.params;
  const { action, imageUrls, incidentType, description } = req.body;

  try {
    const result = await collectorService.updateItemStatus(req.uid, req.userProfile.fullName, {
      sourceType,
      id,
      action,
      imageUrls,
      incidentType,
      description,
    });
    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thành công.',
      data: result,
    });
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) {
      console.error('[API] Lỗi cập nhật trạng thái collector:', error.message);
    }
    return res.status(status).json({ error: error.message || 'Không thể cập nhật trạng thái.' });
  }
});

app.patch('/api/route-assignments/:assignmentId/status', verifyToken, ensureCollector, async (req, res) => {
  const { assignmentId } = req.params;
  const statusMap = {
    in_progress: 'start',
    completed: 'complete',
    delayed: 'incident',
  };
  const action = statusMap[req.body.status] || req.body.action;

  try {
    const result = await collectorService.updateItemStatus(req.uid, req.userProfile.fullName, {
      sourceType: 'assignment',
      id: assignmentId,
      action,
      imageUrls: req.body.imageUrls,
      incidentType: req.body.incidentType,
      description: req.body.description || req.body.message,
    });
    return res.status(200).json({ success: true, message: 'Assignment status updated successfully', data: result });
  } catch (error) {
    const httpStatus = error.status || 500;
    return res.status(httpStatus).json({ error: error.message || 'Không thể cập nhật trạng thái tuyến.' });
  }
});

app.get('/api/collector/reports', verifyToken, ensureCollector, async (req, res) => {
  try {
    const data = await collectorService.getAssignedReports(req.uid);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[API] Lỗi lấy phản ánh collector:', error.message);
    return res.status(500).json({ error: 'Không thể tải phản ánh được giao.' });
  }
});

app.get('/api/reports/:reportId/comments', verifyToken, ensureCollector, async (req, res) => {
  try {
    const data = await collectorService.getReportComments(req.params.reportId, req.uid);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Không thể tải lịch sử xử lý.' });
  }
});

app.patch('/api/reports/:reportId/status', verifyToken, ensureCollector, async (req, res) => {
  const { status, message, imageUrls } = req.body;
  try {
    const result = await collectorService.updateReportStatus(
      req.uid,
      req.userProfile,
      req.params.reportId,
      { status, message, imageUrls },
    );
    return res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      data: result,
    });
  } catch (error) {
    const httpStatus = error.status || 500;
    if (httpStatus >= 500) {
      console.error('[API] Lỗi cập nhật phản ánh:', error.message);
    }
    return res.status(httpStatus).json({ error: error.message || 'Không thể cập nhật phản ánh.' });
  }
});

app.post('/api/collector/confirm-route', verifyToken, ensureCollector, async (req, res) => {
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

    const scheduleData = snapshot.data();
    const assigned = scheduleData.assigned_collector || scheduleData.collector_id || '';
    const isOwner = assigned === req.uid || assigned === req.userProfile.fullName;
    if (assigned && !isOwner) {
      return res.status(403).json({ error: 'Lịch này không được gán cho bạn.' });
    }

    await docRef.update({
      collector_confirmed: true,
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Lỗi xác nhận tuyến của nhân viên thu gom:', error.message);
    return res.status(500).json({ error: 'Không thể xác nhận tuyến. Vui lòng thử lại sau.' });
  }
});

app.put('/api/manager/schedules/:scheduleId', verifyToken, ensureManager, async (req, res) => {
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
});

app.delete('/api/manager/schedules/:scheduleId', verifyToken, ensureManager, async (req, res) => {
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
});

app.get('/api/manager/complaints', verifyToken, ensureManager, async (req, res) => {
  try {
    const complaints = await complaintService.getAllComplaints();
    return res.status(200).json(complaints);
  } catch (error) {
    console.error('[API] Lỗi lấy phản ánh:', error.message);
    return res.status(500).json({ error: 'Không thể tải danh sách phản ánh.' });
  }
});

/**
 * PATCH /api/manager/complaints/:complaintId/status
 * Manager cập nhật trạng thái phản ánh (in_resolve, resolved, rejected).
 */
app.patch('/api/manager/complaints/:complaintId/status', verifyToken, ensureManager, async (req, res) => {
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
});

/**
 * GET /api/resident/upcoming-schedules
 * Lấy lịch thu gom sắp tới cho cư dân dựa trên khu vực đã đăng ký.
 * Chỉ trả về ngày và giờ thu gom.
 */
app.get('/api/resident/upcoming-schedules', verifyToken, async (req, res) => {
  try {
    // Lấy thông tin user để lấy khu vực đã đăng ký
    const userDoc = await db.collection(USERS_COLLECTION).doc(req.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin người dùng.' });
    }

    const userData = normalizeUser(userDoc.data(), req.uid);
    const userArea = userData.area || '';

    if (!userArea) {
      return res.status(200).json([]);
    }

    // Lấy tất cả lịch thu gom
    const snapshot = await db.collection('collection_schedules').get();
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const now = new Date();
    let schedules = [];
    snapshot.forEach(doc => {
      schedules.push({ id: doc.id, ...doc.data() });
    });

    // Lọc lịch theo khu vực user (fuzzy match với city hoặc ward)
    // Khu vực user thường là "Quận Sơn Trà, Đà Nẵng" — ta cần kiểm tra xem schedule.city hoặc schedule.ward có nằm trong area không
    const normalizeStr = (str) => {
      if (!str) return '';
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedArea = normalizeStr(userArea);

    schedules = schedules.filter(s => {
      const normalizedCity = normalizeStr(s.city);
      const normalizedWard = normalizeStr(s.ward);
      // Khớp nếu city hoặc ward nằm trong area hoặc ngược lại
      return normalizedArea.includes(normalizedCity) || normalizedCity.includes(normalizedArea) ||
             normalizedArea.includes(normalizedWard) || normalizedWard.includes(normalizedArea);
    });

    // Chỉ lấy lịch sắp tới (ngày >= hôm nay)
    const todayStr = now.toISOString().slice(0, 10);
    schedules = schedules.filter(s => {
      if (!s.schedule_date) return false;
      const schedDate = new Date(s.schedule_date).toISOString().slice(0, 10);
      return schedDate >= todayStr;
    });

    // Sắp xếp theo ngày tăng dần
    schedules.sort((a, b) => {
      const dateA = new Date(a.schedule_date);
      const dateB = new Date(b.schedule_date);
      return dateA - dateB;
    });

    // Chỉ trả về thông tin cần thiết: ngày, giờ, loại rác
    const result = schedules.map(s => ({
      id: s.id,
      schedule_date: s.schedule_date,
      service_type: s.service_type || '',
      route_name: s.route_name || '',
      city: s.city || '',
      ward: s.ward || '',
      neighborhood: s.neighborhood || '',
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('[API] Lỗi lấy lịch thu gom cho cư dân:', error.message);
    return res.status(500).json({ error: 'Không thể tải lịch thu gom khu vực của bạn.' });
  }
});

app.get('/api/manager/feedback-reports', verifyToken, ensureManager, async (req, res) => {
  try {
    const status = req.query.status || null;
    const data = await reportService.listReports(status);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[API] Lỗi lấy feedback reports:', error.message);
    return res.status(500).json({ error: 'Không thể tải danh sách phản ánh môi trường.' });
  }
});

app.get('/api/manager/feedback-reports/:reportId/comments', verifyToken, ensureManager, async (req, res) => {
  try {
    const data = await reportService.getReportComments(req.params.reportId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[API] Lỗi lấy comments phản ánh:', error.message);
    return res.status(500).json({ error: 'Không thể tải lịch sử xử lý.' });
  }
});

app.patch('/api/manager/feedback-reports/:reportId/approve', verifyToken, ensureManager, async (req, res) => {
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
});

app.get('/api/manager/reports', verifyToken, ensureManager, async (req, res) => {
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
});

// Health check endpoint
app.post('/api/invoices', verifyToken, ensureResident, async (req, res) => {
  try {
    const {
      invoiceId,
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
      updatedAt,
    } = req.body;

    if (!invoiceId || !amount || !currency || !dueDate || !feeType) {
      return res.status(400).json({ error: 'invoiceId, amount, currency, dueDate và feeType là bắt buộc.' });
    }

    const invoice = await invoiceService.createOrUpdateInvoice({
      invoiceId,
      amount,
      billingMonth,
      billingYear,
      createdAt,
      createdBy,
      currency,
      dueDate,
      feeType,
      paidAt: paidAt || null,
      status: status || 'unpaid',
      updatedAt: updatedAt || createdAt || new Date().toISOString(),
      userId: req.uid,
    });

    return res.status(201).json(invoice);
  } catch (error) {
    console.error('[API] Lỗi tạo/cập nhật hóa đơn:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/current', verifyToken, ensureResident, async (req, res) => {
  try {
    const invoice = await invoiceService.getLatestInvoiceForUser(req.uid);
    if (!invoice) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn hiện tại.' });
    }

    if (invoice.status !== 'paid') {
      try {
        const { paymentUrl, qrCode } = await createPayOSPaymentSession(invoice, req.uid, req.headers.origin);
        invoice.paymentUrl = paymentUrl;
        invoice.qrCode = qrCode || null;
      } catch (paymentError) {
        console.warn('[API] Không thể tạo session PayOS tự động:', paymentError.message);
      }
    }

    return res.status(200).json(invoice);
  } catch (error) {
    console.error('[API] Lỗi lấy hóa đơn hiện tại:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/history', verifyToken, ensureResident, async (req, res) => {
  try {
    const invoices = await invoiceService.getPaidInvoicesForUser(req.uid);
    return res.status(200).json(invoices);
  } catch (error) {
    console.error('[API] Lỗi lấy lịch sử giao dịch:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/:invoiceId', verifyToken, ensureResident, async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.invoiceId);
    if (!invoice || invoice.userId !== req.uid) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn.' });
    }
    return res.status(200).json(invoice);
  } catch (error) {
    console.error('[API] Lỗi lấy hóa đơn theo ID:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

function normalizeDescription(text) {
  if (!text) return 'Thanh toan';
  const map = {
    'à':'a','á':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a','â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
    'đ':'d',
    'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e','ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
    'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
    'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o','ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
    'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u','ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
    'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
    'À':'A','Á':'A','Ả':'A','Ã':'A','Ạ':'A','Ă':'A','Ằ':'A','Ắ':'A','Ẳ':'A','Ẵ':'A','Ặ':'A','Â':'A','Ầ':'A','Ấ':'A','Ẩ':'A','Ẫ':'A','Ậ':'A',
    'Đ':'D',
    'È':'E','É':'E','Ẻ':'E','Ẽ':'E','Ẹ':'E','Ê':'E','Ề':'E','Ế':'E','Ể':'E','Ễ':'E','Ệ':'E',
    'Ì':'I','Í':'I','Ỉ':'I','Ĩ':'I','Ị':'I',
    'Ò':'O','Ó':'O','Ỏ':'O','Õ':'O','Ọ':'O','Ô':'O','Ồ':'O','Ố':'O','Ổ':'O','Ỗ':'O','Ộ':'O','Ơ':'O','Ờ':'O','Ớ':'O','Ở':'O','Ỡ':'O','Ợ':'O',
    'Ù':'U','Ú':'U','Ủ':'U','Ũ':'U','Ụ':'U','Ư':'U','Ừ':'U','Ứ':'U','Ử':'U','Ữ':'U','Ự':'U',
    'Ỳ':'Y','Ý':'Y','Ỷ':'Y','Ỹ':'Y','Ỵ':'Y'
  };
  let result = text.split('').map(char => map[char] || char).join('');
  result = result.replace(/[^a-zA-Z0-9 ]/g, '');
  return result.substring(0, 25).trim();
}

function buildPayOSSignature(amount, cancelUrl, description, orderCode, returnUrl, checksumKey) {
  const data = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  return crypto.createHmac('sha256', checksumKey).update(data).digest('hex');
}

async function createPayOSPaymentSession(invoice, userId, originUrl) {
  // Nếu đã tạo link thanh toán rồi, ta chỉ việc trả về link cũ để tránh tạo lại (tránh lỗi 231)
  if (invoice.paymentUrl && invoice.orderCode) {
    return { paymentUrl: invoice.paymentUrl, qrCode: invoice.qrCode };
  }

  let orderCode = invoice.orderCode;
  if (!orderCode) {
    // Generate orderCode as a unique integer
    orderCode = Date.now();
    await invoiceService.updateInvoice(invoice.invoiceId, { orderCode });
    invoice.orderCode = orderCode;
  }

  const origin = originUrl || 'http://localhost:5173';
  const returnUrl = `${origin}/thanh-toan`;
  const cancelUrl = `${origin}/thanh-toan`;

  const isPayOSConfigured = 
    PAYOS_CLIENT_ID && 
    PAYOS_CLIENT_ID !== 'YOUR_PAYOS_CLIENT_ID' && 
    PAYOS_API_KEY && 
    PAYOS_API_KEY !== 'YOUR_PAYOS_API_KEY' && 
    PAYOS_CHECKSUM_KEY && 
    PAYOS_CHECKSUM_KEY !== 'YOUR_PAYOS_CHECKSUM_KEY';

  if (isPayOSConfigured) {
    const description = normalizeDescription(`Thanh toan phi ve sinh`);
    const amount = Number(invoice.amount);
    
    let signature = buildPayOSSignature(
      amount,
      cancelUrl,
      description,
      orderCode,
      returnUrl,
      PAYOS_CHECKSUM_KEY
    );

    let payload = {
      orderCode,
      amount,
      description,
      cancelUrl,
      returnUrl,
      signature
    };

    console.log('[PayOS] Gửi yêu cầu tạo link thanh toán với orderCode:', orderCode);
    let response = await fetch(`${PAYOS_API_BASE_URL}/v2/payment-requests`, {
      method: 'POST',
      headers: {
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let data = await response.json();

    // PayOS trả về HTTP 200 nhưng code là '231' nếu lỗi Đơn đã tồn tại.
    // Xử lý lỗi 231: Đơn thanh toán đã tồn tại (do code cũ bị kẹt trên PayOS mà chưa lưu URL)
    if (String(data.code) === '231') {
      console.log('[PayOS] Lỗi 231: Đơn đã tồn tại. Đang thử lấy lại thông tin đơn cũ...');
      try {
        const getResp = await fetch(`${PAYOS_API_BASE_URL}/v2/payment-requests/${orderCode}`, {
          method: 'GET',
          headers: {
            'x-client-id': PAYOS_CLIENT_ID,
            'x-api-key': PAYOS_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        const getData = await getResp.json();
        
        // Nếu lấy thành công và có checkoutUrl
        if (getResp.ok && String(getData.code) === '00' && getData.data?.checkoutUrl) {
          console.log('[PayOS] Lấy lại link cũ thành công!');
          await invoiceService.updateInvoice(invoice.invoiceId, {
            paymentUrl: getData.data.checkoutUrl,
            qrCode: getData.data.qrCode || null
          });
          return { paymentUrl: getData.data.checkoutUrl, qrCode: getData.data.qrCode || null };
        }
      } catch (err) {
        console.warn('[PayOS] Không thể lấy thông tin đơn cũ:', err.message);
      }

      // Nếu không lấy được đơn cũ (hoặc bị hết hạn), ta tiến hành tạo orderCode mới
      console.log('[PayOS] Không lấy được link cũ, tạo orderCode mới và thử lại...');
      orderCode = Date.now() + Math.floor(Math.random() * 1000);
      
      signature = buildPayOSSignature(
        amount, cancelUrl, description, orderCode, returnUrl, PAYOS_CHECKSUM_KEY
      );
      payload.orderCode = orderCode;
      payload.signature = signature;

      response = await fetch(`${PAYOS_API_BASE_URL}/v2/payment-requests`, {
        method: 'POST',
        headers: {
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      data = await response.json();
      if (response.ok && String(data.code) === '00') {
        await invoiceService.updateInvoice(invoice.invoiceId, { orderCode });
        invoice.orderCode = orderCode;
      }
    }

    console.log('[PayOS] Phản hồi từ PayOS API:', JSON.stringify(data));
    
    // PayOS báo lỗi bằng code khác '00' dù HTTP có thể là 200 OK
    if (!response.ok || (data.code && String(data.code) !== '00')) {
      console.error('[PayOS] Lỗi từ PayOS API:', data);
      throw new Error(data.desc || data.error || 'Không thể tạo yêu cầu PayOS.');
    }

    const checkoutUrl = data?.data?.checkoutUrl;
    // qrCode là chuỗi VietQR Pro (EMVCo)
    const qrCode = data?.data?.qrCode || null;

    if (!checkoutUrl) {
      console.error('[PayOS] Không tìm thấy checkoutUrl trong phản hồi:', data);
      throw new Error(`PayOS không trả về link thanh toán. Mã: ${data?.code}, Mô tả: ${data?.desc}`);
    }

    // Lưu URL vào CSDL để dùng lại cho các lần fetch sau
    await invoiceService.updateInvoice(invoice.invoiceId, {
      paymentUrl: checkoutUrl,
      qrCode: qrCode
    });

    console.log('[PayOS] qrCode (VietQR):', qrCode ? 'Có' : 'Không có');
    return { paymentUrl: checkoutUrl, qrCode };
  }

  return {
    paymentUrl: `https://payos.example.com/qr?client_id=${encodeURIComponent(PAYOS_CLIENT_ID || 'demo')}&invoice_id=${encodeURIComponent(invoice.invoiceId)}&amount=${invoice.amount}`,
  };
}

async function verifyPayOSPayment(invoice) {
  const isPayOSConfigured = 
    PAYOS_CLIENT_ID && 
    PAYOS_CLIENT_ID !== 'YOUR_PAYOS_CLIENT_ID' && 
    PAYOS_API_KEY && 
    PAYOS_API_KEY !== 'YOUR_PAYOS_API_KEY' && 
    PAYOS_CHECKSUM_KEY && 
    PAYOS_CHECKSUM_KEY !== 'YOUR_PAYOS_CHECKSUM_KEY';

  if (isPayOSConfigured) {
    const orderCode = invoice.orderCode;
    if (!orderCode) {
      throw new Error('Hóa đơn chưa được khởi tạo giao dịch thanh toán.');
    }

    console.log('[PayOS] Đang kiểm tra trạng thái cho orderCode:', orderCode);
    const response = await fetch(`${PAYOS_API_BASE_URL}/v2/payment-requests/${orderCode}`, {
      method: 'GET',
      headers: {
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[PayOS] Lỗi khi lấy trạng thái giao dịch:', data);
      throw new Error(data.desc || data.error || 'Không thể kiểm tra trạng thái PayOS.');
    }

    return data.data && (data.data.status === 'PAID' || data.data.status === 'COMPLETED');
  }

  throw new Error('PayOS is not configured. Cannot verify payment status.');
}

app.post('/api/invoices/:invoiceId/payment-request', verifyToken, ensureResident, async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.invoiceId);
    if (!invoice || invoice.userId !== req.uid) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn để thanh toán.' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Hóa đơn đã được thanh toán.' });
    }

    const { paymentUrl, qrCode } = await createPayOSPaymentSession(invoice, req.uid, req.headers.origin);
    return res.status(200).json({ paymentUrl, qrCode });
  } catch (error) {
    console.error('[API] Lỗi tạo yêu cầu thanh toán PayOS:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices/:invoiceId/verify-payment', verifyToken, ensureResident, async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.invoiceId);
    if (!invoice || invoice.userId !== req.uid) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn.' });
    }

    if (invoice.status === 'paid') {
      return res.status(200).json({ invoice, paid: true });
    }

    const paid = await verifyPayOSPayment(invoice);
    if (!paid) {
      return res.status(402).json({ error: 'Thanh toán chưa hoàn tất.', invoice, paid: false });
    }

    const updatedInvoice = await invoiceService.updateInvoice(invoice.invoiceId, {
      status: 'paid',
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Tạo bản ghi giao dịch trong collection 'payments'
    const paymentId = `payment_${Date.now()}`;
    await db.collection('payments').doc(paymentId).set({
      paymentId,
      invoiceId: invoice.invoiceId,
      userId: req.uid,
      amount: invoice.amount,
      currency: invoice.currency || 'VND',
      method: 'PayOS',
      transactionCode: `PAYOS_${invoice.invoiceId}`,
      status: 'success',
      gatewayResponse: { code: '00', message: 'Success' },
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    });

    return res.status(200).json({ invoice: updatedInvoice, paid: true });
  } catch (error) {
    console.error('[API] Lỗi kiểm tra thanh toán hóa đơn:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/manager/invoices', verifyToken, ensureManager, async (req, res) => {
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
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// ============================================================
// MIDDLEWARE: Xác thực Firebase JWT Token
// ============================================================

/**
 * Middleware xác thực Token Firebase.
 * Trích xuất UID người dùng và gán vào req.uid để các route phía sau sử dụng.
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Thiếu token xác thực.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    console.error('[Auth] Lỗi xác thực token:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Token không hợp lệ hoặc đã hết hạn.' });
  }
}

// ============================================================
// ROUTES: Phản ánh Cư dân (/api/complaints)
// ============================================================

/**
 * POST /api/complaints
 * Cư dân gửi phản ánh mới.
 */
app.post('/api/complaints', verifyToken, ensureResident, async (req, res) => {
  try {
    const result = await complaintService.createComplaint(
      req.uid,
      req.userProfile.fullName,
      req.body
    );
    return res.status(201).json(result);
  } catch (error) {
    console.error('[API] Lỗi gửi phản ánh cư dân:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/complaints
 * Lấy danh sách các phản ánh của cư dân đang đăng nhập.
 */
app.get('/api/complaints', verifyToken, ensureResident, async (req, res) => {
  try {
    const result = await complaintService.getUserComplaints(req.uid);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[API] Lỗi lấy danh sách phản ánh cư dân:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROUTES: Thông báo Cư dân (/api/notifications)
// ============================================================

/**
 * GET /api/notifications
 * Lấy danh sách thông báo của cư dân đang đăng nhập.
 */
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const notifications = await notificationService.getNotifications(req.uid);
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('[API] Lỗi lấy danh sách thông báo:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/:id/read
 * Đánh dấu một thông báo là đã đọc.
 */
app.post('/api/notifications/:id/read', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await notificationService.markAsRead(id, req.uid);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`[API] Lỗi đánh dấu đã đọc notification ${id}:`, error.message);
    const statusCode = error.message.includes('quyền') ? 403 : 500;
    return res.status(statusCode).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/read-all
 * Đánh dấu toàn bộ thông báo của cư dân là đã đọc.
 */
app.post('/api/notifications/read-all', verifyToken, async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.uid);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[API] Lỗi đánh dấu đã đọc tất cả:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/notifications/settings
 * Lấy cấu hình nhận thông báo của cư dân.
 */
app.get('/api/notifications/settings', verifyToken, async (req, res) => {
  try {
    const settings = await notificationService.getNotificationSettings(req.uid);
    return res.status(200).json(settings);
  } catch (error) {
    console.error('[API] Lỗi lấy cài đặt thông báo:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/settings
 * Cập nhật cấu hình nhận thông báo của cư dân.
 */
app.post('/api/notifications/settings', verifyToken, async (req, res) => {
  const { email, sms, push } = req.body;
  try {
    await notificationService.updateNotificationSettings(req.uid, { email, sms, push });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Lỗi cập nhật cài đặt thông báo:', error.message);
    return res.status(500).json({ error: error.message });
  }
});


/**
 * GET /api/notifications/admin
 * [ADMIN] Lấy toàn bộ danh sách thông báo.
 */
app.get('/api/notifications/admin', verifyToken, ensureAdmin, async (req, res) => {
  try {
    const { role } = req.query;
    const notifications = await notificationService.getAdminNotifications(role);
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('[API] Lỗi lấy danh sách thông báo admin:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/admin
 * [ADMIN] Tạo một thông báo mới.
 */
app.post('/api/notifications/admin', verifyToken, ensureAdmin, async (req, res) => {
  try {
    const result = await notificationService.createAdminNotification(req.body);
    return res.status(201).json(result);
  } catch (error) {
    console.error('[API] Lỗi tạo thông báo admin:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/notifications/admin/:id
 * [ADMIN] Cập nhật thông báo.
 */
app.put('/api/notifications/admin/:id', verifyToken, ensureAdmin, async (req, res) => {
  try {
    const result = await notificationService.updateAdminNotification(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[API] Lỗi cập nhật thông báo admin:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/notifications/admin/:id
 * [ADMIN] Xóa thông báo.
 */
app.delete('/api/notifications/admin/:id', verifyToken, ensureAdmin, async (req, res) => {
  try {
    const result = await notificationService.deleteAdminNotification(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[API] Lỗi xóa thông báo admin:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GOOGLE MAPS API PROXY ENDPOINTS
// ============================================================
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

/**
 * GET /api/maps/key
 * Trả về Google Maps API key cho người dùng đã đăng nhập.
 */
app.get('/api/maps/key', verifyToken, (req, res) => {
  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({ error: 'Google Maps API key chưa được cấu hình trên server.' });
  }
  return res.status(200).json({ apiKey: GOOGLE_MAPS_API_KEY });
});

/**
 * GET /api/maps/directions
 * Proxy cho Google Directions API.
 * Query params: origin, destination, waypoints (optional, pipe-separated)
 */
app.get('/api/maps/directions', verifyToken, async (req, res) => {
  const { origin, destination, waypoints } = req.query;
  if (!origin || !destination) {
    return res.status(400).json({ error: 'Thiếu origin hoặc destination.' });
  }

  try {
    const params = new URLSearchParams({
      origin,
      destination,
      key: GOOGLE_MAPS_API_KEY,
      mode: 'driving',
      language: 'vi',
    });
    if (waypoints) params.set('waypoints', waypoints);

    const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('[Maps] Lỗi Directions API:', error.message);
    return res.status(500).json({ error: 'Không thể lấy chỉ đường từ Google Maps.' });
  }
});

/**
 * GET /api/maps/geocode
 * Proxy cho Google Geocoding API.
 * Query params: address OR latlng
 */
app.get('/api/maps/geocode', verifyToken, async (req, res) => {
  const { address, latlng } = req.query;
  if (!address && !latlng) {
    return res.status(400).json({ error: 'Thiếu address hoặc latlng.' });
  }

  try {
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      language: 'vi',
    });
    if (address) params.set('address', address);
    if (latlng) params.set('latlng', latlng);

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('[Maps] Lỗi Geocoding API:', error.message);
    return res.status(500).json({ error: 'Không thể geocode địa chỉ.' });
  }
});

/**
 * GET /api/maps/places
 * Proxy cho Google Places API (Text Search).
 * Query params: query, location (optional), radius (optional)
 */
app.get('/api/maps/places', verifyToken, async (req, res) => {
  const { query, location, radius } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Thiếu query tìm kiếm.' });
  }

  try {
    const params = new URLSearchParams({
      query,
      key: GOOGLE_MAPS_API_KEY,
      language: 'vi',
    });
    if (location) params.set('location', location);
    if (radius) params.set('radius', radius);

    const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('[Maps] Lỗi Places API:', error.message);
    return res.status(500).json({ error: 'Không thể tìm kiếm địa điểm.' });
  }
});

/**
 * GET /api/maps/distance-matrix
 * Proxy cho Google Distance Matrix API.
 * Query params: origins (pipe-separated), destinations (pipe-separated)
 */
app.get('/api/maps/distance-matrix', verifyToken, async (req, res) => {
  const { origins, destinations } = req.query;
  if (!origins || !destinations) {
    return res.status(400).json({ error: 'Thiếu origins hoặc destinations.' });
  }

  try {
    const params = new URLSearchParams({
      origins,
      destinations,
      key: GOOGLE_MAPS_API_KEY,
      mode: 'driving',
      language: 'vi',
    });

    const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('[Maps] Lỗi Distance Matrix API:', error.message);
    return res.status(500).json({ error: 'Không thể tính khoảng cách.' });
  }
});
// Khởi chạy Server Express
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`==================================================`);
    console.log(`  EcoSchedule Secure Backend is running on ${HOST}:${PORT}`);
    console.log(`  API Base URL: http://${HOST}:${PORT}`);
    console.log(`==================================================`);
  });
}

module.exports = app;

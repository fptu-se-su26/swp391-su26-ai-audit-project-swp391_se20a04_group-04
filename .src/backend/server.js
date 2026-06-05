// Trigger reload of .env configuration
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { db, auth } = require('./firebaseAdmin');
const { ROLES, normalizeRole } = require('./constants/roles');
const addressService = require('./services/addressService');
const scheduleService = require('./services/scheduleService');
const notificationService = require('./services/notificationService');

const app = express();
const PORT = process.env.PORT || 5000;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// CORS configuration - Allow frontend server
app.use(cors({
  origin: '*', // Hỗ trợ tất cả nguồn hoặc tùy chỉnh thành frontend URL (e.g., http://localhost:5173)
  credentials: true,
}));

app.use(express.json());

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
  const { fullName, email, phone, password, address, role } = req.body;

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
      role: normalizeRole(role),
      emailVerified: false,
      createdAt: new Date().toISOString(),
      area: 'Quận Sơn Trà, Đà Nẵng',
    };

    // Ghi nhận đồng thời vào hai collection ('người dùng' và 'users') để tương thích với tất cả trang
    // Vì đang chạy ở Backend sử dụng Firebase Admin SDK, thao tác này vượt qua mọi rules bảo mật client!
    console.log(`[Register] Đang lưu thông tin tài khoản ${uid} vào Firestore database...`);
    await db.collection(USERS_COLLECTION).doc(uid).set(userData);
    await db.collection('users').doc(uid).set(userData);

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
    let userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    }

    let userData = {};
    if (userDoc.exists) {
      userData = normalizeUser(userDoc.data(), uid);
      
      // Cập nhật trạng thái emailVerified lên true trong Firestore nếu chưa đồng bộ
      if (!userDoc.data().emailVerified) {
        await db.collection('users').doc(uid).update({ emailVerified: true });
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
    const userDoc = await db.collection(USERS_COLLECTION).doc(req.uid).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin người dùng để xác thực vai trò.' });
    }

    const userData = normalizeUser(userDoc.data(), req.uid);
    if (userData.role !== ROLES.MANAGER) {
      return res.status(403).json({ error: 'Chỉ có manager mới được phép truy cập chức năng này.' });
    }

    req.userProfile = userData;
    next();
  } catch (error) {
    console.error('[Auth] Lỗi kiểm tra vai trò Manager:', error.message);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xác thực vai trò manager.' });
  }
}

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
    notes,
  } = req.body;

  if (!routeName || !serviceType || !date || !time || !city || !ward) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin lịch thu gom.' });
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
      status: assignedTruck && assignedDriver ? 'Assigned' : 'Planned',
      notes: notes || '',
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
  const { scheduleId, assignedTruck, assignedDriver } = req.body;
  if (!scheduleId || !assignedTruck || !assignedDriver) {
    return res.status(400).json({ error: 'Vui lòng cung cấp ID lịch, xe và tài xế để gán tuyến.' });
  }

  try {
    const docRef = db.collection('collection_schedules').doc(scheduleId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Không tìm thấy lịch cần gán tuyến.' });
    }

    await docRef.update({
      assigned_truck: assignedTruck,
      assigned_driver: assignedDriver,
      status: 'Assigned',
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API] Lỗi gán tuyến cho lịch thu gom:', error.message);
    return res.status(500).json({ error: 'Không thể gán tuyến cho lịch. Vui lòng thử lại sau.' });
  }
});

app.get('/api/manager/complaints', verifyToken, ensureManager, async (req, res) => {
  try {
    const snapshot = await db.collection('complaints').orderBy('created_at', 'desc').limit(20).get();
    const complaints = [];
    snapshot.forEach((doc) => complaints.push({ id: doc.id, ...doc.data() }));
    return res.status(200).json(complaints);
  } catch (error) {
    console.error('[API] Lỗi lấy phản ánh:', error.message);
    return res.status(500).json({ error: 'Không thể tải danh sách phản ánh.' });
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
 * POST /api/notifications/seed
 * [DEV ONLY] Tạo dữ liệu thông báo mẫu cho cư dân đang đăng nhập để kiểm thử.
 * LƯU Ý: Xóa hoặc bảo vệ route này trước khi deploy lên production!
 */
app.post('/api/notifications/seed', verifyToken, async (req, res) => {
  try {
    const result = await notificationService.seedNotificationsForUser(req.uid);
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    console.error('[API] Lỗi seed dữ liệu thông báo:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Khởi chạy Server Express
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  EcoSchedule Secure Backend is running on port ${PORT}`);
  console.log(`  API Base URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});

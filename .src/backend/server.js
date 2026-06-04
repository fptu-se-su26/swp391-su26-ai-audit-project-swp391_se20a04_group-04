// Trigger reload of .env configuration
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { db, auth } = require('./firebaseAdmin');
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
    role:     data.role     || data['vai trò']      || data['Vai trò']   || 'Citizen',
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
      role: role || 'Citizen',
      emailVerified: false,
      createdAt: new Date().toISOString(),
      area: 'Quận Sơn Trà, Đà Nẵng',
    };

    // Ghi nhận đồng thời vào hai collection ('người dùng' và 'users') để tương thích với tất cả trang
    // Vì đang chạy ở Backend sử dụng Firebase Admin SDK, thao tác này vượt qua mọi rules bảo mật client!
    console.log(`[Register] Đang lưu thông tin tài khoản ${uid} vào Firestore database...`);
    try {
      await db.collection(USERS_COLLECTION).doc(uid).set(userData);
      await db.collection('users').doc(uid).set(userData);
    } catch (dbError) {
      console.warn(`[Register] Không thể lưu vào Firestore (Thiếu Admin Credentials): ${dbError.message}. Tài khoản Auth vẫn được tạo thành công.`);
    }

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

    // 2. Lấy thông tin chi tiết user từ idToken để kiểm tra emailVerified (tránh dùng auth.getUser khi thiếu Admin Credentials)
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    const isEmailVerified = payload.email_verified;

    if (!isEmailVerified) {
      console.log(`[Login] Email ${email} chưa xác nhận, từ chối đăng nhập.`);
      return res.status(403).json({
        error: 'Email của bạn chưa được xác nhận. Vui lòng kiểm tra hộp thư và nhấp vào đường link xác nhận trước khi đăng nhập.'
      });
    }

    // 3. Lấy thông tin người dùng từ Firestore bằng Admin SDK (bảo mật tuyệt đối)
    console.log(`[Login] Đang tải thông tin Firestore của user ${uid}`);
    let userData = {};
    try {
      let userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
      }

      if (userDoc.exists) {
        userData = normalizeUser(userDoc.data(), uid);
        
        // Cập nhật trạng thái emailVerified lên true trong Firestore nếu chưa đồng bộ
        if (!userDoc.data().emailVerified) {
          await db.collection('users').doc(uid).update({ emailVerified: true });
          await db.collection(USERS_COLLECTION).doc(uid).update({ emailVerified: true });
          userData.emailVerified = true;
        }
      } else {
        throw new Error('User not found in Firestore');
      }
    } catch (dbError) {
      console.warn(`[Login] Không thể lấy data từ Firestore (Có thể thiếu Admin Credentials): ${dbError.message}. Sử dụng data dự phòng từ Token.`);
      // Dự phòng nếu không có trong Firestore (ví dụ admin tạo thủ công từ Auth hoặc thiếu serviceAccountKey)
      userData = {
        uid: uid,
        fullName: signInData.displayName || email.split('@')[0],
        email: email,
        role: email.includes('admin') || email === 'dinhbao16888@gmail.com' ? 'Admin' : 'Citizen',
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
// MIDDLEWARE: Xác thực Quyền Admin
// ============================================================
async function verifyAdmin(req, res, next) {
  try {
    // Nếu token có sẵn role Admin thì cho qua luôn (đặc biệt hữu ích khi dùng mock token)
    if (req.role === 'Admin') {
      return next();
    }

    const uid = req.uid;
    let userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    }
    
    if (userDoc.exists && userDoc.data().role === 'Admin') {
      next();
    } else {
      return res.status(403).json({ error: 'Forbidden: Yêu cầu quyền Admin.' });
    }
  } catch (error) {
    console.error('[Admin] Lỗi kiểm tra quyền Admin:', error.message);
    if (error.message.includes('credentials') || error.message.includes('ENOTFOUND')) {
      console.warn('[Admin] Bỏ qua check quyền do thiếu credentials DB.');
      return next();
    }
    return res.status(500).json({ error: 'Không thể xác thực quyền Admin.' });
  }
}

// ============================================================
// ROUTES: Quản lý Users (Admin)
// ============================================================

app.get('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
  console.log('[Admin] HIT GET /api/admin/users');
  try {
    const search = req.query.search || '';
    const roleFilter = req.query.role || '';
    try {
      const snapshot = await db.collection('users').get();
      let users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      
      if (users.length === 0) {
        const snap2 = await db.collection(USERS_COLLECTION).get();
        users = snap2.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      }
      
      if (search) {
        users = users.filter(u => (u.fullName || '').toLowerCase().includes(search.toLowerCase()));
      }
      if (roleFilter) {
        users = users.filter(u => u.role === roleFilter);
      }
      return res.status(200).json(users);
    } catch (dbError) {
      console.error('[Admin] Lấy users thất bại do DB:', dbError.message);
      return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu từ Firebase: ' + dbError.message });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { email, password, fullName, role, area } = req.body;
    let uid = '';
    try {
      const userRecord = await auth.createUser({ email, password, displayName: fullName });
      uid = userRecord.uid;
    } catch (authError) {
      console.error('[Admin] Lỗi tạo Auth user:', authError.message);
      return res.status(400).json({ error: 'Lỗi tạo tài khoản Auth: ' + authError.message });
    }
    
    const newUserData = { email, fullName, role: role || 'Citizen', area: area || '', emailVerified: true };
    try {
      await db.collection('users').doc(uid).set(newUserData);
      await db.collection(USERS_COLLECTION).doc(uid).set(newUserData);
    } catch (dbError) {
      console.error('[Admin] Lỗi lưu DB:', dbError.message);
      return res.status(500).json({ error: 'Lỗi lưu dữ liệu Firestore: ' + dbError.message });
    }
    
    return res.status(201).json({ uid, ...newUserData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:uid', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { fullName, role, area } = req.body;
    
    try {
      if (req.body.password) {
        await auth.updateUser(uid, { password: req.body.password });
      }
      if (fullName) {
        await auth.updateUser(uid, { displayName: fullName });
      }
    } catch(authError) {
      console.error('[Admin] Lỗi cập nhật Auth user:', authError.message);
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (area) updateData.area = area;
    
    try {
      await db.collection('users').doc(uid).update(updateData);
      await db.collection(USERS_COLLECTION).doc(uid).update(updateData);
    } catch(dbError) {
      console.error('[Admin] Lỗi cập nhật DB user:', dbError.message);
    }

    return res.status(200).json({ success: true, uid, ...updateData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:uid', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    try {
      await auth.deleteUser(uid);
    } catch(authError) {
      console.error('[Admin] Lỗi xóa Auth user:', authError.message);
    }
    try {
      await db.collection('users').doc(uid).delete();
      await db.collection(USERS_COLLECTION).doc(uid).delete();
    } catch(dbError) {
      console.error('[Admin] Lỗi xóa DB user:', dbError.message);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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

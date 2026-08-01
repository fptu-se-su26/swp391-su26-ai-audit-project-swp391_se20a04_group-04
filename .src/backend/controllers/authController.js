const crypto = require('crypto');
const { db, auth } = require('../config/firebase');
const { ROLES } = require('../constants/roles');
const { normalizeUser } = require('../helpers/normalizeUser');
const emailService = require('../services/emailService');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const USERS_COLLECTION = 'users';

const CODE_TTL_MS = 15 * 60 * 1000; // 15 phút
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 giây giữa các lần gửi lại

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

/**
 * Tạo mã xác nhận mới, lưu (hash) vào Firestore và gửi email cho user.
 */
async function issueVerificationCode(uid, email) {
  const code = generateCode();
  await db.collection(USERS_COLLECTION).doc(uid).update({
    emailVerification: {
      codeHash: hashCode(code),
      expiresAt: Date.now() + CODE_TTL_MS,
      lastSentAt: Date.now(),
    },
  });
  await emailService.sendVerificationCodeEmail(email, code);
}

/**
 * POST /api/auth/register
 */
async function register(req, res) {
  // Lưu ý: trường `role` từ client bị bỏ qua hoàn toàn vì lý do bảo mật.
  // Mọi tài khoản đăng ký mới luôn được gán vai trò RESIDENT.
  // Admin mới có quyền thay đổi vai trò qua trang Quản lý người dùng.
  const { fullName, email, phone, password, address, area } = req.body;

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

    // 2. Chuẩn bị dữ liệu để ghi vào Firestore bằng Admin SDK
    const userData = {
      uid,
      fullName,
      email,
      phone: phone || '',
      address: address || '',
      role: ROLES.RESIDENT,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      area: area || 'Quận Sơn Trà, Đà Nẵng',
    };

    // Ghi nhận vào collection 'users' bằng Firebase Admin SDK
    console.log(`[Register] Đang lưu thông tin tài khoản ${uid} vào Firestore database...`);
    await db.collection(USERS_COLLECTION).doc(uid).set(userData);

    // 3. Gửi email chứa mã xác nhận (tự gửi qua SMTP, không phụ thuộc Firebase)
    try {
      console.log(`[Register] Đang gửi mã xác nhận cho: ${email}`);
      await issueVerificationCode(uid, email);
    } catch (emailError) {
      console.error('[Register] Cảnh báo: Không gửi được email xác nhận:', emailError.message);
      return res.status(201).json({
        success: true,
        warning: 'Tài khoản đã tạo nhưng gửi email xác nhận thất bại. Vui lòng dùng chức năng "Gửi lại mã".',
      });
    }

    console.log(`[Register] Đăng ký thành công cho user: ${email} (${uid})`);
    return res.status(201).json({ success: true });

  } catch (error) {
    console.error('[Register] Lỗi hệ thống khi đăng ký:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống khi đăng ký tài khoản. Vui lòng thử lại sau.' });
  }
}

/**
 * POST /api/auth/verify-email
 * Body: { email, code }
 */
async function verifyEmail(req, res) {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Vui lòng cung cấp Email và mã xác nhận.' });
  }

  try {
    const userRecord = await auth.getUserByEmail(email).catch(() => null);
    if (!userRecord) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
    }

    const userDoc = await db.collection(USERS_COLLECTION).doc(userRecord.uid).get();
    const verification = userDoc.data()?.emailVerification;

    if (!verification) {
      return res.status(400).json({ error: 'Không có mã xác nhận nào đang chờ. Vui lòng yêu cầu gửi lại mã.' });
    }

    if (Date.now() > verification.expiresAt) {
      return res.status(400).json({ error: 'Mã xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại mã.' });
    }

    if (hashCode(code) !== verification.codeHash) {
      return res.status(400).json({ error: 'Mã xác nhận không đúng.' });
    }

    await auth.updateUser(userRecord.uid, { emailVerified: true });
    await db.collection(USERS_COLLECTION).doc(userRecord.uid).update({
      emailVerified: true,
      emailVerification: null,
    });

    console.log(`[VerifyEmail] Xác nhận email thành công: ${email}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[VerifyEmail] Lỗi hệ thống khi xác nhận email:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống khi xác nhận email. Vui lòng thử lại sau.' });
  }
}

/**
 * POST /api/auth/resend-code
 * Body: { email }
 */
async function resendCode(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Vui lòng cung cấp Email.' });
  }

  try {
    const userRecord = await auth.getUserByEmail(email).catch(() => null);
    if (!userRecord) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
    }

    if (userRecord.emailVerified) {
      return res.status(400).json({ error: 'Email này đã được xác nhận trước đó.' });
    }

    const userDoc = await db.collection(USERS_COLLECTION).doc(userRecord.uid).get();
    const lastSentAt = userDoc.data()?.emailVerification?.lastSentAt || 0;
    if (Date.now() - lastSentAt < RESEND_COOLDOWN_MS) {
      return res.status(429).json({ error: 'Vui lòng đợi ít nhất 60 giây trước khi yêu cầu gửi lại mã.' });
    }

    await issueVerificationCode(userRecord.uid, email);
    console.log(`[ResendCode] Đã gửi lại mã xác nhận cho: ${email}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[ResendCode] Lỗi hệ thống khi gửi lại mã:', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống khi gửi lại mã. Vui lòng thử lại sau.' });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
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
    let isEmailVerified = true; // Mặc định cho phép qua nếu lỗi Admin SDK
    let userRecord;
    try {
      userRecord = await auth.getUser(uid);
      isEmailVerified = userRecord.emailVerified;
    } catch (err) {
      console.warn(`[Login] Bỏ qua kiểm tra emailVerified do thiếu serviceAccountKey: ${err.message}`);
    }

    if (!isEmailVerified) {
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
        fullName: userRecord?.displayName || email.split('@')[0],
        email: email,
        role: ROLES.RESIDENT,
        area: 'Quận Sơn Trà, Đà Nẵng',
        emailVerified: true,
      };
    }

    if (userData.role === ROLES.ADMIN) {
      console.log(`[Login] Role ${userData.role} không được phép đăng nhập vào ứng dụng dành cho người dùng`);
      return res.status(403).json({ error: 'Tài khoản admin không thể đăng nhập vào ứng dụng này. Vui lòng sử dụng trang quản trị.' });
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
}

/**
 * POST /api/auth/google-login
 */
async function googleLogin(req, res) {
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
        area: '',
        emailVerified,
        createdAt: new Date().toISOString(),
      };

      await db.collection(USERS_COLLECTION).doc(uid).set(userData);
    }

    if (userData.role === ROLES.ADMIN) {
      console.log(`[GoogleLogin] Role ${userData.role} không được phép đăng nhập vào ứng dụng dành cho người dùng`);
      return res.status(403).json({ error: 'Tài khoản admin không thể đăng nhập vào ứng dụng này. Vui lòng sử dụng trang quản trị.' });
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
}

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Vui lòng cung cấp Email.' });
  }

  try {
    const userRecord = await auth.getUserByEmail(email).catch(() => null);
    if (!userRecord) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
    }

    // Lấy client origin từ request header để động trỏ link về frontend của client
    const clientOrigin = req.headers.origin || 'http://localhost:5173';

    // Tạo action link khôi phục mật khẩu thông qua Firebase Admin SDK
    const actionCodeSettings = {
      url: `${clientOrigin}/reset-password`,
      handleCodeInApp: false,
    };
    
    const resetLink = await auth.generatePasswordResetLink(email, actionCodeSettings);

    // Gửi email qua SMTP
    const subject = '[EcoSchedule] Khôi phục mật khẩu tài khoản';
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #059669; text-align: center; margin-bottom: 24px;">EcoSchedule Đà Nẵng</h2>
        <p>Xin chào,</p>
        <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản EcoSchedule của bạn.</p>
        <p>Vui lòng click vào nút bên dưới để tiến hành đổi mật khẩu mới:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
        </div>
        <p style="font-size: 13px; color: #4b5563;">Liên kết này có hiệu lực trong 1 giờ. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này an toàn.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center;">EcoSchedule — Hệ thống quản lý thu gom rác thải thông minh</p>
      </div>
    `;

    await emailService.sendMail({ to: email, subject, html });

    console.log(`[ForgotPassword] Đã gửi link reset password cho: ${email}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[ForgotPassword] Lỗi khi xử lý quên mật khẩu:', error);
    return res.status(500).json({ error: error.message || 'Lỗi hệ thống khi gửi email khôi phục.' });
  }
}

module.exports = { register, login, googleLogin, verifyEmail, resendCode, forgotPassword };

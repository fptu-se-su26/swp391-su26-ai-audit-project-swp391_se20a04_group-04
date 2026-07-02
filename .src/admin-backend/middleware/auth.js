const { auth } = require('../config/firebase');

/**
 * Middleware xác thực Firebase JWT Token.
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

module.exports = verifyToken;

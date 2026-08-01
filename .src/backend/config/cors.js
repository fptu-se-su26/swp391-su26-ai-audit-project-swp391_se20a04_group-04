const cors = require('cors');

/**
 * Danh sách origins được phép truy cập API.
 */
const allowedOrigins = [
  'https://swp391-database.web.app',
  'https://swp391-database.firebaseapp.com',
  'https://ecoschedule.online',       // custom domain
  'https://www.ecoschedule.online',   // custom domain (www)
  process.env.FRONTEND_URL,          // tuỳ chỉnh qua biến môi trường
  'http://localhost:5173',            // Vite dev server
  'http://localhost:5001',            // local backend (same-origin)
].filter(Boolean);

/**
 * Trả về middleware CORS đã cấu hình.
 */
function getCorsMiddleware() {
  return cors({
    origin(origin, callback) {
      // Cho phép request không có origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Cho phép tất cả các nguồn từ localhost và 127.0.0.1 (mọi port) để hỗ trợ phát triển local
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost) return callback(null, true);

      // Trả về false thay vì throw Error để tránh crash request
      // Browser sẽ tự chặn (không có CORS header) nhưng server không crash
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
}

module.exports = { getCorsMiddleware, allowedOrigins };

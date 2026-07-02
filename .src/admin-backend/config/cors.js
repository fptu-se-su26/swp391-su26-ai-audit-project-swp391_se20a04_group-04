const cors = require('cors');

/**
 * Danh sách origins được phép truy cập Admin API.
 */
const allowedOrigins = [
  'https://swp391-database.web.app',
  'https://swp391-database.firebaseapp.com',
  'https://ecoschedule.online',       // custom domain
  'https://www.ecoschedule.online',   // custom domain (www)
  process.env.FRONTEND_URL,          // tuỳ chỉnh qua biến môi trường
  'http://localhost:5173',            // Vite dev server
  'http://localhost:5174',            // Admin frontend
  'http://localhost:5001',            // local backend (same-origin)
  'http://localhost:5002',            // admin backend
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
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  });
}

module.exports = { getCorsMiddleware, allowedOrigins };

const rateLimitStore = {};

/**
 * Custom in-memory rate limiter middleware.
 * Giới hạn tối đa 10 yêu cầu trong vòng 1 phút.
 */
function rateLimiter(req, res, next) {
  const key = req.uid || req.ip;
  const now = Date.now();

  if (!rateLimitStore[key]) {
    rateLimitStore[key] = [];
  }

  // Loại bỏ các mốc thời gian ngoài khoảng 1 phút (60,000ms)
  rateLimitStore[key] = rateLimitStore[key].filter(timestamp => now - timestamp < 60000);

  if (rateLimitStore[key].length >= 10) {
    return res.status(429).json({
      error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ một lát rồi thử lại.'
    });
  }

  rateLimitStore[key].push(now);
  next();
}

module.exports = rateLimiter;

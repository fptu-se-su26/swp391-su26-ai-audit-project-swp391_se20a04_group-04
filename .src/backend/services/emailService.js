const nodemailer = require('nodemailer');

let cachedTransporter = null;

/**
 * Tạo (và cache) transporter Nodemailer từ cấu hình SMTP trong .env.
 * Hỗ trợ Gmail (dùng App Password) hoặc bất kỳ SMTP host nào khác.
 */
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP_USER/SMTP_PASS chưa được cấu hình trong .env');
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: Number(SMTP_PORT) || 465,
    secure: Number(SMTP_PORT) !== 587, // 465 = SSL, 587 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return cachedTransporter;
}

async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();
  const fromName = process.env.SMTP_FROM_NAME || 'EcoSchedule';
  await transporter.sendMail({
    from: `"${fromName}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

/**
 * Gửi email chứa mã xác nhận đăng ký (6 chữ số).
 */
async function sendVerificationCodeEmail(to, code) {
  await sendMail({
    to,
    subject: 'Xác nhận tài khoản EcoSchedule',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #059669;">Xác nhận tài khoản EcoSchedule</h2>
        <p>Chào bạn, đây là mã xác nhận để kích hoạt tài khoản của bạn:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827;">${code}</p>
        <p>Mã có hiệu lực trong 15 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
      </div>
    `,
  });
}

module.exports = { sendMail, sendVerificationCodeEmail };

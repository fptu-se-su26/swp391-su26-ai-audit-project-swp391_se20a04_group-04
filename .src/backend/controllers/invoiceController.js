const { db } = require('../config/firebase');
const invoiceService = require('../services/invoiceService');
const { serializeInvoice } = require('../services/invoiceService');
const { createPayOSPaymentSession, verifyPayOSPayment } = require('../helpers/payosHelper');
const emailService = require('../services/emailService');

/**
 * POST /api/invoices
 */
async function createInvoice(req, res) {
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
}

/**
 * GET /api/invoices/current
 */
async function getCurrentInvoice(req, res) {
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
}

/**
 * GET /api/invoices/history
 */
async function getInvoiceHistory(req, res) {
  try {
    const invoices = await invoiceService.getPaidInvoicesForUser(req.uid);
    return res.status(200).json(invoices);
  } catch (error) {
    console.error('[API] Lỗi lấy lịch sử giao dịch:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/invoices/:invoiceId
 */
async function getInvoiceById(req, res) {
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
}

/**
 * POST /api/invoices/:invoiceId/payment-request
 */
async function createPaymentRequest(req, res) {
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
}

/**
 * POST /api/invoices/:invoiceId/verify-payment
 */
async function verifyPayment(req, res) {
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
    const transactionCode = `PAYOS_${invoice.invoiceId}`;
    await db.collection('payments').doc(paymentId).set({
      paymentId,
      invoiceId: invoice.invoiceId,
      userId: req.uid,
      amount: invoice.amount,
      currency: invoice.currency || 'VND',
      method: 'PayOS',
      transactionCode,
      status: 'success',
      gatewayResponse: { code: '00', message: 'Success' },
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    });

    // Gửi thông báo thanh toán thành công CHỈ cho Cư dân (chủ sở hữu hóa đơn)
    await db.collection('notifications').add({
      user_id: invoice.userId || req.uid,
      targetRole: 'resident',
      title: 'Thanh toán thành công',
      content: `Bạn đã thanh toán thành công hóa đơn phí vệ sinh môi trường tháng ${invoice.billingMonth || ''}/${invoice.billingYear || ''}. Số tiền: ${Number(invoice.amount || 0).toLocaleString('vi-VN')} ₫. Mã giao dịch: ${transactionCode}.`,
      type: 'payment_success',
      is_read: false,
      sent_at: new Date(),
    });

    // Gửi email xác nhận thanh toán thành công cho cư dân trong tiến trình nền
    (async () => {
      try {
        const userDoc = await db.collection('users').doc(invoice.userId || req.uid).get();
        if (userDoc.exists) {
          const user = userDoc.data();
          if (user.email) {
            await emailService.sendMail({
              to: user.email,
              subject: `[EcoSchedule] Xác nhận thanh toán thành công hóa đơn – Tháng ${invoice.billingMonth || ''}/${invoice.billingYear || ''}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #059669; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">EcoSchedule</h2>
                    <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Hệ thống quản lý lịch thu gom & hóa đơn môi trường</p>
                  </div>
                  <div style="border-top: 4px solid #10b981; padding-top: 24px;">
                    <h3 style="color: #059669; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-align: center;">Thanh toán thành công!</h3>
                    <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                      Cảm ơn bạn đã hoàn thành nghĩa vụ đóng phí vệ sinh môi trường. Giao dịch của bạn đã được ghi nhận thành công trên hệ thống EcoSchedule.
                    </p>
                    <div style="background: #f8fafc; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Mã hóa đơn:</td>
                          <td style="color: #0f172a; font-size: 14px; text-align: right; padding-bottom: 8px;">${invoice.invoiceId}</td>
                        </tr>
                        <tr>
                          <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Mã giao dịch:</td>
                          <td style="color: #0f172a; font-size: 14px; font-weight: 700; text-align: right; padding-bottom: 8px;">${transactionCode}</td>
                        </tr>
                        <tr>
                          <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Kỳ hóa đơn:</td>
                          <td style="color: #0f172a; font-size: 14px; text-align: right; padding-bottom: 8px;">Tháng ${invoice.billingMonth || ''}/${invoice.billingYear || ''}</td>
                        </tr>
                        <tr>
                          <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Số tiền đã trả:</td>
                          <td style="color: #059669; font-size: 15px; font-weight: 700; text-align: right; padding-bottom: 8px;">${Number(invoice.amount || 0).toLocaleString('vi-VN')} ₫</td>
                        </tr>
                        <tr>
                          <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Phương thức:</td>
                          <td style="color: #0f172a; font-size: 14px; text-align: right; padding-bottom: 8px;">Thanh toán trực tuyến PayOS</td>
                        </tr>
                        <tr>
                          <td style="color: #64748b; font-size: 14px;">Thời gian:</td>
                          <td style="color: #0f172a; font-size: 14px; text-align: right;">${new Date().toLocaleString('vi-VN')}</td>
                        </tr>
                      </table>
                    </div>
                  </div>
                  <div style="margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
                    Đây là email tự động từ EcoSchedule. Vui lòng không phản hồi email này.<br>
                    EcoSchedule Đà Nẵng — Công nghệ vì môi trường xanh.
                  </div>
                </div>
              `
            });
          }
        }
      } catch (err) {
        console.error("Lỗi khi gửi email xác nhận thanh toán thành công:", err.message);
      }
    })().catch(err => console.error("Lỗi gửi email thanh toán thành công:", err));

    return res.status(200).json({ invoice: updatedInvoice, paid: true });
  } catch (error) {
    console.error('[API] Lỗi kiểm tra thanh toán hóa đơn:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

async function getMyInvoices(req, res) {
  try {
    const snapshot = await db.collection('invoices')
      .where('userId', '==', req.uid)
      .get();
    const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const getTimestampMillis = (value) => {
      if (!value) return 0;
      if (value.toDate) return value.toDate().getTime();
      return new Date(value).getTime();
    };
    invoices.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
    return res.status(200).json(invoices.map(inv => serializeInvoice(inv)));
  } catch (error) {
    console.error('[API] Lỗi lấy danh sách hóa đơn cá nhân:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createInvoice,
  getCurrentInvoice,
  getInvoiceHistory,
  getInvoiceById,
  createPaymentRequest,
  verifyPayment,
  getMyInvoices,
};

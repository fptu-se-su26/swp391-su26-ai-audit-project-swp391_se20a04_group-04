const { db } = require('../config/firebase');
const invoiceService = require('../services/invoiceService');
const { createPayOSPaymentSession, verifyPayOSPayment } = require('../helpers/payosHelper');

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

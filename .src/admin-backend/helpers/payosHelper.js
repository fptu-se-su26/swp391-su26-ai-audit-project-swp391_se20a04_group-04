const crypto = require('crypto');
const { payosConfig, isPayOSConfigured } = require('../config/payos');
const invoiceService = require('../services/invoiceService');

/**
 * Chuẩn hóa description cho PayOS (bỏ dấu tiếng Việt, giới hạn 25 ký tự).
 */
function normalizeDescription(text) {
  if (!text) return 'Thanh toan';
  const map = {
    'à':'a','á':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a','â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
    'đ':'d',
    'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e','ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
    'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
    'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o','ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
    'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u','ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
    'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
    'À':'A','Á':'A','Ả':'A','Ã':'A','Ạ':'A','Ă':'A','Ằ':'A','Ắ':'A','Ẳ':'A','Ẵ':'A','Ặ':'A','Â':'A','Ầ':'A','Ấ':'A','Ẩ':'A','Ẫ':'A','Ậ':'A',
    'Đ':'D',
    'È':'E','É':'E','Ẻ':'E','Ẽ':'E','Ẹ':'E','Ê':'E','Ề':'E','Ế':'E','Ể':'E','Ễ':'E','Ệ':'E',
    'Ì':'I','Í':'I','Ỉ':'I','Ĩ':'I','Ị':'I',
    'Ò':'O','Ó':'O','Ỏ':'O','Õ':'O','Ọ':'O','Ô':'O','Ồ':'O','Ố':'O','Ổ':'O','Ỗ':'O','Ộ':'O','Ơ':'O','Ờ':'O','Ớ':'O','Ở':'O','Ỡ':'O','Ợ':'O',
    'Ù':'U','Ú':'U','Ủ':'U','Ũ':'U','Ụ':'U','Ư':'U','Ừ':'U','Ứ':'U','Ử':'U','Ữ':'U','Ự':'U',
    'Ỳ':'Y','Ý':'Y','Ỷ':'Y','Ỹ':'Y','Ỵ':'Y'
  };
  let result = text.split('').map(char => map[char] || char).join('');
  result = result.replace(/[^a-zA-Z0-9 ]/g, '');
  return result.substring(0, 25).trim();
}

/**
 * Tạo chữ ký HMAC-SHA256 cho PayOS.
 */
function buildPayOSSignature(amount, cancelUrl, description, orderCode, returnUrl, checksumKey) {
  const data = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  return crypto.createHmac('sha256', checksumKey).update(data).digest('hex');
}

/**
 * Tạo phiên thanh toán PayOS cho hóa đơn.
 */
async function createPayOSPaymentSession(invoice, userId, originUrl) {
  // Nếu đã tạo link thanh toán rồi, ta chỉ việc trả về link cũ để tránh tạo lại (tránh lỗi 231)
  if (invoice.paymentUrl && invoice.orderCode) {
    return { paymentUrl: invoice.paymentUrl, qrCode: invoice.qrCode };
  }

  let orderCode = invoice.orderCode;
  if (!orderCode) {
    // Generate orderCode as a unique integer
    orderCode = Date.now();
    await invoiceService.updateInvoice(invoice.invoiceId, { orderCode });
    invoice.orderCode = orderCode;
  }

  const origin = originUrl || 'http://localhost:5173';
  const returnUrl = `${origin}/thanh-toan`;
  const cancelUrl = `${origin}/thanh-toan`;

  if (isPayOSConfigured()) {
    const description = normalizeDescription(`Thanh toan phi ve sinh`);
    const amount = Number(invoice.amount);
    
    let signature = buildPayOSSignature(
      amount,
      cancelUrl,
      description,
      orderCode,
      returnUrl,
      payosConfig.checksumKey
    );

    let payload = {
      orderCode,
      amount,
      description,
      cancelUrl,
      returnUrl,
      signature
    };

    console.log('[PayOS] Gửi yêu cầu tạo link thanh toán với orderCode:', orderCode);
    let response = await fetch(`${payosConfig.apiBaseUrl}/v2/payment-requests`, {
      method: 'POST',
      headers: {
        'x-client-id': payosConfig.clientId,
        'x-api-key': payosConfig.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let data = await response.json();

    // PayOS trả về HTTP 200 nhưng code là '231' nếu lỗi Đơn đã tồn tại.
    // Xử lý lỗi 231: Đơn thanh toán đã tồn tại (do code cũ bị kẹt trên PayOS mà chưa lưu URL)
    if (String(data.code) === '231') {
      console.log('[PayOS] Lỗi 231: Đơn đã tồn tại. Đang thử lấy lại thông tin đơn cũ...');
      try {
        const getResp = await fetch(`${payosConfig.apiBaseUrl}/v2/payment-requests/${orderCode}`, {
          method: 'GET',
          headers: {
            'x-client-id': payosConfig.clientId,
            'x-api-key': payosConfig.apiKey,
            'Content-Type': 'application/json'
          }
        });
        const getData = await getResp.json();
        
        // Nếu lấy thành công và có checkoutUrl
        if (getResp.ok && String(getData.code) === '00' && getData.data?.checkoutUrl) {
          console.log('[PayOS] Lấy lại link cũ thành công!');
          await invoiceService.updateInvoice(invoice.invoiceId, {
            paymentUrl: getData.data.checkoutUrl,
            qrCode: getData.data.qrCode || null
          });
          return { paymentUrl: getData.data.checkoutUrl, qrCode: getData.data.qrCode || null };
        }
      } catch (err) {
        console.warn('[PayOS] Không thể lấy thông tin đơn cũ:', err.message);
      }

      // Nếu không lấy được đơn cũ (hoặc bị hết hạn), ta tiến hành tạo orderCode mới
      console.log('[PayOS] Không lấy được link cũ, tạo orderCode mới và thử lại...');
      orderCode = Date.now() + Math.floor(Math.random() * 1000);
      
      signature = buildPayOSSignature(
        amount, cancelUrl, description, orderCode, returnUrl, payosConfig.checksumKey
      );
      payload.orderCode = orderCode;
      payload.signature = signature;

      response = await fetch(`${payosConfig.apiBaseUrl}/v2/payment-requests`, {
        method: 'POST',
        headers: {
          'x-client-id': payosConfig.clientId,
          'x-api-key': payosConfig.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      data = await response.json();
      if (response.ok && String(data.code) === '00') {
        await invoiceService.updateInvoice(invoice.invoiceId, { orderCode });
        invoice.orderCode = orderCode;
      }
    }

    console.log('[PayOS] Phản hồi từ PayOS API:', JSON.stringify(data));
    
    // PayOS báo lỗi bằng code khác '00' dù HTTP có thể là 200 OK
    if (!response.ok || (data.code && String(data.code) !== '00')) {
      console.error('[PayOS] Lỗi từ PayOS API:', data);
      throw new Error(data.desc || data.error || 'Không thể tạo yêu cầu PayOS.');
    }

    const checkoutUrl = data?.data?.checkoutUrl;
    // qrCode là chuỗi VietQR Pro (EMVCo)
    const qrCode = data?.data?.qrCode || null;

    if (!checkoutUrl) {
      console.error('[PayOS] Không tìm thấy checkoutUrl trong phản hồi:', data);
      throw new Error(`PayOS không trả về link thanh toán. Mã: ${data?.code}, Mô tả: ${data?.desc}`);
    }

    // Lưu URL vào CSDL để dùng lại cho các lần fetch sau
    await invoiceService.updateInvoice(invoice.invoiceId, {
      paymentUrl: checkoutUrl,
      qrCode: qrCode
    });

    console.log('[PayOS] qrCode (VietQR):', qrCode ? 'Có' : 'Không có');
    return { paymentUrl: checkoutUrl, qrCode };
  }

  return {
    paymentUrl: `https://payos.example.com/qr?client_id=${encodeURIComponent(payosConfig.clientId || 'demo')}&invoice_id=${encodeURIComponent(invoice.invoiceId)}&amount=${invoice.amount}`,
  };
}

/**
 * Xác minh trạng thái thanh toán qua PayOS API.
 */
async function verifyPayOSPayment(invoice) {
  if (isPayOSConfigured()) {
    const orderCode = invoice.orderCode;
    if (!orderCode) {
      throw new Error('Hóa đơn chưa được khởi tạo giao dịch thanh toán.');
    }

    console.log('[PayOS] Đang kiểm tra trạng thái cho orderCode:', orderCode);
    const response = await fetch(`${payosConfig.apiBaseUrl}/v2/payment-requests/${orderCode}`, {
      method: 'GET',
      headers: {
        'x-client-id': payosConfig.clientId,
        'x-api-key': payosConfig.apiKey,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[PayOS] Lỗi khi lấy trạng thái giao dịch:', data);
      throw new Error(data.desc || data.error || 'Không thể kiểm tra trạng thái PayOS.');
    }

    return data.data && (data.data.status === 'PAID' || data.data.status === 'COMPLETED');
  }

  throw new Error('PayOS is not configured. Cannot verify payment status.');
}

module.exports = {
  normalizeDescription,
  buildPayOSSignature,
  createPayOSPaymentSession,
  verifyPayOSPayment,
};

/**
 * Script: debugPayOS.js
 * Gọi trực tiếp PayOS API và in toàn bộ response để debug.
 *
 * Chạy: node scripts/debugPayOS.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const crypto = require('crypto');

const PAYOS_CLIENT_ID   = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY     = process.env.PAYOS_API_KEY;
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;
const PAYOS_API_BASE_URL = process.env.PAYOS_API_BASE_URL || 'https://api-merchant.payos.vn';

function buildSignature(amount, cancelUrl, description, orderCode, returnUrl) {
  const data = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  return crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY).update(data).digest('hex');
}

async function main() {
  const orderCode  = Date.now();
  const amount     = 10000;
  const description = 'Thanh toan phi ve sinh';
  const returnUrl  = 'http://localhost:5173/thanh-toan';
  const cancelUrl  = 'http://localhost:5173/thanh-toan';

  const signature = buildSignature(amount, cancelUrl, description, orderCode, returnUrl);

  const payload = { orderCode, amount, description, cancelUrl, returnUrl, signature };

  console.log('\n[Debug] Gửi request tới PayOS:');
  console.log(JSON.stringify(payload, null, 2));

  const response = await fetch(`${PAYOS_API_BASE_URL}/v2/payment-requests`, {
    method: 'POST',
    headers: {
      'x-client-id': PAYOS_CLIENT_ID,
      'x-api-key': PAYOS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  console.log('\n[Debug] ===== FULL PAYOS RESPONSE =====');
  console.log(JSON.stringify(data, null, 2));
  console.log('======================================\n');

  if (data?.data?.qrCode) {
    console.log('✅ qrCode CÓ trong response:', data.data.qrCode.substring(0, 60) + '...');
  } else {
    console.log('❌ qrCode KHÔNG có trong response hoặc là null');
    console.log('   Các fields trong data:', Object.keys(data?.data || {}));
  }

  if (data?.data?.checkoutUrl) {
    console.log('✅ checkoutUrl:', data.data.checkoutUrl);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[Debug] Lỗi:', err.message);
  process.exit(1);
});

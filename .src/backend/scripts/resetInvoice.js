/**
 * Script: resetInvoice.js
 * Reset hóa đơn về trạng thái unpaid để test lại luồng thanh toán.
 *
 * Chạy bằng lệnh:
 *   node scripts/resetInvoice.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { db } = require('../firebaseAdmin');

const TARGET_UID = 'vjEKNNKSuPPUo5izBu3qem28mXU2';
const INVOICE_ID = `invoice_${TARGET_UID}_2026_6`;

async function main() {
  console.log(`\n[Reset] Đang reset hóa đơn: ${INVOICE_ID}\n`);

  const docRef = db.collection('invoices').doc(INVOICE_ID);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.error('[Reset] ❌ Không tìm thấy hóa đơn. Kiểm tra lại INVOICE_ID.');
    process.exit(1);
  }

  const before = doc.data();
  console.log(`[Reset] Trạng thái hiện tại : ${before.status}`);
  console.log(`[Reset] Số tiền hiện tại    : ${before.amount?.toLocaleString('vi-VN')} VND`);
  console.log(`[Reset] paidAt hiện tại     : ${before.paidAt ?? 'null'}`);

  // Reset về unpaid + đổi amount 10.000 VND + xóa orderCode để PayOS tạo link mới
  await docRef.update({
    status: 'unpaid',
    amount: 10000,
    paidAt: null,
    orderCode: null,
    paymentUrl: null,
    updatedAt: new Date(),
  });

  const after = (await docRef.get()).data();
  console.log(`\n[Reset] ✅ Reset thành công!`);
  console.log(`           Mã hóa đơn : ${INVOICE_ID}`);
  console.log(`           Trạng thái : ${after.status}`);
  console.log(`           Số tiền    : ${after.amount?.toLocaleString('vi-VN')} VND`);
  console.log(`           paidAt     : ${after.paidAt ?? 'null'}`);
  console.log(`           orderCode  : ${after.orderCode ?? 'null (sẽ tạo mới khi thanh toán)'}`);
  console.log(`\n[Reset] 🎉 Cư dân có thể vào trang Thanh toán và test lại với 10.000 VND.\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error('[Reset] ❌ Lỗi:', err.message);
  process.exit(1);
});

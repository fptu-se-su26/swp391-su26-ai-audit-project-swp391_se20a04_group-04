/**
 * Script: createInvoiceForResident.js
 * Tạo hóa đơn trực tiếp vào Firestore cho cư dân cụ thể.
 *
 * Chạy bằng lệnh:
 *   node scripts/createInvoiceForResident.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { db } = require('../firebaseAdmin');

const TARGET_UID = 'vjEKNNKSuPPUo5izBu3qem28mXU2';
const TARGET_EMAIL = 'truedameyasuo0333@gmail.com';

// Tháng/năm thanh toán hiện tại
const BILLING_MONTH = 6;
const BILLING_YEAR = 2026;

async function main() {
  console.log(`\n[Script] Đang tạo hóa đơn cho user: ${TARGET_EMAIL} (UID: ${TARGET_UID})\n`);

  // 1. Kiểm tra user tồn tại trong Firestore
  const userDoc = await db.collection('users').doc(TARGET_UID).get();
  if (!userDoc.exists) {
    console.error('[Script] ❌ Không tìm thấy user trong Firestore. Vui lòng kiểm tra lại UID.');
    process.exit(1);
  }

  const userData = userDoc.data();
  console.log(`[Script] ✅ Tìm thấy user: ${userData.fullName || userData.email}`);
  console.log(`[Script]    Role: ${userData.role}`);

  // 2. Kiểm tra đã có hóa đơn chưa (tránh tạo trùng)
  const existingSnapshot = await db.collection('invoices')
    .where('userId', '==', TARGET_UID)
    .where('billingMonth', '==', BILLING_MONTH)
    .where('billingYear', '==', BILLING_YEAR)
    .get();

  if (!existingSnapshot.empty) {
    const existing = existingSnapshot.docs[0].data();
    console.log(`\n[Script] ⚠️  Hóa đơn tháng ${BILLING_MONTH}/${BILLING_YEAR} đã tồn tại:`);
    console.log(`           ID: ${existing.invoiceId}`);
    console.log(`           Trạng thái: ${existing.status}`);
    console.log(`           Số tiền: ${existing.amount?.toLocaleString('vi-VN')} ${existing.currency}`);
    console.log('\n[Script] Không tạo mới để tránh trùng lặp. Hóa đơn sẵn sàng để thanh toán.');
    process.exit(0);
  }

  // 3. Tạo hóa đơn mới
  const now = new Date();
  const invoiceId = `invoice_${TARGET_UID}_${BILLING_YEAR}_${BILLING_MONTH}`;
  const dueDate = new Date(`${BILLING_YEAR}-${String(BILLING_MONTH).padStart(2, '0')}-25T17:00:00.000Z`);

  const invoiceData = {
    invoiceId,
    userId: TARGET_UID,
    amount: 50000,
    billingMonth: BILLING_MONTH,
    billingYear: BILLING_YEAR,
    createdAt: now,
    createdBy: 'system_script',
    currency: 'VND',
    dueDate,
    feeType: 'monthly_sanitation_fee',
    paidAt: null,
    status: 'unpaid',
    updatedAt: now,
  };

  await db.collection('invoices').doc(invoiceId).set(invoiceData, { merge: true });

  console.log(`\n[Script] ✅ Tạo hóa đơn thành công!`);
  console.log(`           Mã hóa đơn : ${invoiceId}`);
  console.log(`           Người dùng : ${TARGET_EMAIL}`);
  console.log(`           Kỳ thanh toán: Tháng ${BILLING_MONTH}/${BILLING_YEAR}`);
  console.log(`           Số tiền    : ${invoiceData.amount.toLocaleString('vi-VN')} VND`);
  console.log(`           Hạn thanh toán: ${dueDate.toLocaleDateString('vi-VN')}`);
  console.log(`           Trạng thái : ${invoiceData.status}`);
  console.log(`\n[Script] 🎉 Cư dân có thể đăng nhập và vào trang Thanh toán để thanh toán hóa đơn này.\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error('[Script] ❌ Lỗi khi tạo hóa đơn:', err.message);
  process.exit(1);
});

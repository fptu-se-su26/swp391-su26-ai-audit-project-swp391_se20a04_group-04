'use strict';

const cron = require('node-cron');
const { db } = require('../config/firebase');
const emailService = require('./emailService');

const REMINDER_DAYS_BEFORE = 3;

async function getUserEmail(userId) {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  return doc.data().email || null;
}

async function sendReminderOrOverdue(invoice, type) {
  const email = await getUserEmail(invoice.userId);
  if (!email) return;

  const label = type === 'overdue' ? 'QUÁ HẠN' : 'SẮP ĐẾN HẠN';
  const subject = `[EcoSchedule] Hóa đơn ${label} – Tháng ${invoice.billingMonth}/${invoice.billingYear}`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
      <h2 style="color:#059669">EcoSchedule</h2>
      <p>Xin chào,</p>
      <p>Hóa đơn của bạn cho tháng <strong>${invoice.billingMonth}/${invoice.billingYear}</strong> 
         (${Number(invoice.amount || 0).toLocaleString('vi-VN')} ₫) hiện đang <strong>${type === 'overdue' ? 'QUÁ HẠN' : 'sắp đến hạn vào ' + new Date(invoice.dueDate).toLocaleDateString('vi-VN')}</strong>.</p>
      <p>Vui lòng đăng nhập hệ thống để thanh toán.</p>
      <p style="color:#6b7280;font-size:13px;">EcoSchedule — Hệ thống quản lý thu gom rác thải Quận Sơn Trà</p>
    </div>`;

  await emailService.sendMail({ to: email, subject, html });

  // Ghi thông báo cá nhân vào Firestore
  await db.collection('notifications').add({
    user_id: invoice.userId,
    title: `Hóa đơn ${label}`,
    content: `Hóa đơn tháng ${invoice.billingMonth}/${invoice.billingYear} (${Number(invoice.amount || 0).toLocaleString('vi-VN')} ₫) ${type === 'overdue' ? 'đã quá hạn.' : 'sắp đến hạn.'}`,
    type: type === 'overdue' ? 'invoice_overdue' : 'invoice_reminder',
    is_read: false,
    sent_at: new Date(),
  });
}

async function runPaymentCheck() {
  console.log('[PaymentJob] Chạy kiểm tra hóa đơn...');
  const now = new Date();
  const reminderCutoff = new Date(now);
  reminderCutoff.setDate(now.getDate() + REMINDER_DAYS_BEFORE);

  try {
    const snap = await db.collection('invoices').where('status', '==', 'unpaid').get();
    if (snap.empty) return;

    const jobs = [];
    snap.forEach(doc => {
      const inv = { id: doc.id, ...doc.data() };
      if (!inv.dueDate) return;

      const due = new Date(inv.dueDate);
      if (Number.isNaN(due.getTime())) return;

      if (due < now) {
        // Mark overdue + send notice
        jobs.push(
          db.collection('invoices').doc(inv.id).update({ status: 'overdue', updatedAt: new Date().toISOString() })
            .then(() => sendReminderOrOverdue(inv, 'overdue'))
        );
      } else if (due <= reminderCutoff) {
        // Send upcoming reminder (only if not already reminded today)
        const lastReminded = inv.lastReminderAt ? new Date(inv.lastReminderAt) : null;
        const alreadyRemindedToday = lastReminded && lastReminded.toDateString() === now.toDateString();
        if (!alreadyRemindedToday) {
          jobs.push(
            db.collection('invoices').doc(inv.id).update({ lastReminderAt: now.toISOString() })
              .then(() => sendReminderOrOverdue(inv, 'reminder'))
          );
        }
      }
    });

    await Promise.allSettled(jobs);
    console.log(`[PaymentJob] Xử lý ${jobs.length} hóa đơn.`);
  } catch (err) {
    console.error('[PaymentJob] Lỗi khi kiểm tra hóa đơn:', err.message);
  }
}

function startPaymentReminderJob() {
  // Chạy mỗi ngày lúc 8:00 sáng
  cron.schedule('0 8 * * *', runPaymentCheck, { timezone: 'Asia/Ho_Chi_Minh' });
  console.log('[PaymentJob] Đã đăng ký cron job nhắc hóa đơn (8:00 AM hàng ngày).');
}

module.exports = { startPaymentReminderJob, runPaymentCheck };

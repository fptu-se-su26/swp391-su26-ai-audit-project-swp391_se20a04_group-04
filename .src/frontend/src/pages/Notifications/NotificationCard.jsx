/**
 * NotificationCard.jsx
 * Component hiển thị một thẻ thông báo đơn lẻ trong danh sách.
 * Nhận toàn bộ dữ liệu thông báo qua props, không tự gọi API.
 */

import { normalizeRole } from '../../constants/roles';
import { TYPE_CONFIG, SENDER_CONFIG, timeAgo } from './notificationUtils';

/**
 * @param {Object}   notification  - Dữ liệu thông báo từ Firestore
 * @param {Function} onClick       - Hàm xử lý khi click vào card (đánh dấu đọc + điều hướng)
 */
export default function NotificationCard({ notification, onClick }) {
  const typeConf   = TYPE_CONFIG[notification.type]          || TYPE_CONFIG.system;
  const senderConf = SENDER_CONFIG[normalizeRole(notification.sender_role)] || SENDER_CONFIG.manager;
  const isUnread   = !notification.is_read;

  return (
    <div
      onClick={() => onClick(notification)}
      className={`relative bg-surface-container-lowest p-6 rounded-xl border flex gap-5 group cursor-pointer transition-all ${
        isUnread
          ? 'border-outline-variant/30 shadow-[0_4px_20px_rgba(0,109,55,0.08)] hover:border-primary/30'
          : 'border-outline-variant/20 opacity-75 hover:opacity-100 hover:border-outline-variant/40'
      }`}
    >
      {/* Chấm tròn góc trên - báo chưa đọc */}
      {isUnread && (
        <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
      )}

      {/* Icon phân loại thông báo */}
      <div className={`w-12 h-12 flex-shrink-0 ${typeConf.bgClass} rounded-full flex items-center justify-center ${typeConf.colorClass}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          {typeConf.icon}
        </span>
      </div>

      <div className="flex-grow min-w-0">
        {/* Tiêu đề + Thời gian */}
        <div className="flex justify-between items-start mb-1 gap-3">
          <h3 className={`font-label-md text-on-surface group-hover:text-primary transition-colors ${isUnread ? 'font-bold' : ''}`}>
            {notification.title || notification.content}
          </h3>
          <span className="text-label-sm text-outline font-medium whitespace-nowrap flex-shrink-0">
            {timeAgo(notification.sent_at)}
          </span>
        </div>

        {/* Nội dung chi tiết (chỉ hiện nếu có tiêu đề riêng) */}
        {notification.title && (
          <p className="text-body-md text-on-surface-variant leading-relaxed line-clamp-2">
            {notification.content}
          </p>
        )}

        {/* Footer: Badge người gửi + Link hành động */}
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          {/* Badge nguồn gửi (Admin / Manager) */}
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${senderConf.badgeClass}`}>
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              {senderConf.icon}
            </span>
            {notification.sender_name || senderConf.label}
          </span>

          {/* Gợi ý hành động */}
          {notification.link && (
            <span className="text-label-sm text-primary font-semibold group-hover:underline">
              Xem chi tiết →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

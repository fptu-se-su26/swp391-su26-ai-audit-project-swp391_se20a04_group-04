/**
 * notificationUtils.js
 * Hằng số và hàm tiện ích dùng chung cho hệ thống thông báo.
 * Import file này ở bất kỳ component nào cần dùng cấu hình thông báo.
 */

/** Ánh xạ loại thông báo (type) sang icon, màu sắc và nhãn hiển thị */
export const TYPE_CONFIG = {
  schedule: {
    icon: 'local_shipping',
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-500/10',
    label: 'Lịch thu gom',
  },
  payment: {
    icon: 'payments',
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-500/10',
    label: 'Thanh toán',
  },
  system: {
    icon: 'notifications_active',
    colorClass: 'text-sky-600',
    bgClass: 'bg-sky-500/10',
    label: 'Hệ thống',
  },
};

/**
 * Ánh xạ vai trò người gửi (sender_role) sang badge icon + màu sắc.
 * Mở rộng thêm key mới ở đây khi kết nối Admin và Manager sau này.
 */
export const SENDER_CONFIG = {
  admin: {
    icon: 'shield',
    label: 'Quản trị viên',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  },
  manager: {
    icon: 'business_center',
    label: 'Ban quản lý',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
};

/** Danh sách tab bộ lọc trên trang thông báo */
export const TABS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'schedule', label: 'Lịch thu gom' },
  { key: 'payment',  label: 'Thanh toán' },
  { key: 'system',   label: 'Hệ thống' },
];

/**
 * Định dạng timestamp ISO thành chuỗi thời gian tương đối dễ đọc.
 * @param {string} isoString - Chuỗi ISO 8601
 * @returns {string} VD: "2 giờ trước", "Vừa xong"
 */
export function timeAgo(isoString) {
  if (!isoString) return '';
  const diffMs   = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${Math.floor(diffHours / 24)} ngày trước`;
}

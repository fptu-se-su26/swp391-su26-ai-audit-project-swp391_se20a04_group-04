/**
 * NotificationSettings.jsx
 * Component sidebar cài đặt tùy chọn nhận thông báo (Email, SMS, Push).
 * Nhận settings hiện tại và callbacks qua props, không tự gọi API.
 */

const CHANNELS = [
  { key: 'email', label: 'Nhận qua Email',           desc: 'Bản tin hàng tuần & hóa đơn' },
  { key: 'sms',   label: 'Nhận qua SMS',             desc: 'Thông báo khẩn cấp & nhắc lịch' },
  { key: 'push',  label: 'Nhận Push Notification',   desc: 'Cảnh báo trực tiếp trên ứng dụng' },
];

/**
 * @param {Object}   settings        - { email: boolean, sms: boolean, push: boolean }
 * @param {Function} onSettingChange - Hàm cập nhật state settings ở component cha
 * @param {Function} onSave          - Hàm gọi API lưu cài đặt
 * @param {boolean}  saving          - Đang trong quá trình lưu
 * @param {boolean}  saved           - Vừa lưu thành công
 */
export default function NotificationSettings() {
  return null;
}


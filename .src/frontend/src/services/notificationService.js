/**
 * Notification Service - Frontend
 * Cổng giao tiếp API thông báo giữa React và Backend Express.
 */
import authService from './authService';

const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/auth', '/api/notifications')
  : 'http://localhost:5001/api/notifications';

/**
 * Tạo header Authorization đính kèm token xác thực.
 * @returns {Object} Headers với Bearer token
 */
function getAuthHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

const notificationService = {
  /**
   * Lấy toàn bộ danh sách thông báo của cư dân đang đăng nhập.
   * @returns {Array} Danh sách thông báo, sắp xếp mới nhất lên đầu
   */
  async getNotifications() {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tải thông báo.');
    return data;
  },

  /**
   * Đánh dấu một thông báo cụ thể là đã đọc.
   * @param {string} notificationId - ID của thông báo
   */
  async markAsRead(notificationId) {
    const response = await fetch(`${BASE_URL}/${notificationId}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể cập nhật trạng thái thông báo.');
    return data;
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc.
   */
  async markAllAsRead() {
    const response = await fetch(`${BASE_URL}/read-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể cập nhật tất cả thông báo.');
    return data;
  },

  /**
   * Lấy cấu hình tùy chọn nhận thông báo của cư dân.
   * @returns {Object} { email: boolean, sms: boolean, push: boolean }
   */
  async getNotificationSettings() {
    const response = await fetch(`${BASE_URL}/settings`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tải cài đặt thông báo.');
    return data;
  },

  /**
   * Cập nhật cấu hình tùy chọn nhận thông báo của cư dân.
   * @param {Object} settings - { email: boolean, sms: boolean, push: boolean }
   */
  async updateNotificationSettings(settings) {
    const response = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể lưu cài đặt thông báo.');
    return data;
  },

  /**
   * [ADMIN] Lấy toàn bộ danh sách thông báo.
   * @param {string} roleFilter - Lọc theo role (tùy chọn)
   */
  async getAdminNotifications(roleFilter = '') {
    let url = `${BASE_URL}/admin`;
    if (roleFilter) url += `?role=${roleFilter}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tải danh sách thông báo Admin.');
    return data;
  },

  /**
   * [ADMIN] Tạo thông báo mới.
   * @param {Object} payload - { title, message, type, targetRole, channels }
   */
  async createNotification(payload) {
    const response = await fetch(`${BASE_URL}/admin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tạo thông báo.');
    return data;
  },

  /**
   * [ADMIN] Cập nhật thông báo.
   * @param {string} id - ID của thông báo
   * @param {Object} payload - { title, message, type, targetRole }
   */
  async updateAdminNotification(id, payload) {
    const response = await fetch(`${BASE_URL}/admin/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể cập nhật thông báo.');
    return data;
  },

  /**
   * [ADMIN] Xóa thông báo.
   * @param {string} id - ID của thông báo
   */
  async deleteAdminNotification(id) {
    const response = await fetch(`${BASE_URL}/admin/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể xóa thông báo.');
    return data;
  },

  /**
   * [DEV ONLY] Tạo dữ liệu thông báo mẫu để kiểm thử nhanh.
   * Chỉ dùng trong môi trường phát triển.
   */
  async seedNotifications() {
    const response = await fetch(`${BASE_URL}/seed`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tạo dữ liệu mẫu.');
    return data;
  },
};

export default notificationService;

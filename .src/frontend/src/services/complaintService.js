/**
 * Complaint Service - Frontend
 * Cổng giao tiếp API phản ánh giữa React và Backend Express.
 */
import authService from './authService';

const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/auth', '/api/complaints')
  : 'http://localhost:5000/api/complaints';

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

const complaintService = {
  /**
   * Lấy danh sách phản ánh đã gửi của cư dân đang đăng nhập.
   * @returns {Promise<Array>} Danh sách phản ánh
   */
  async getComplaints() {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Không thể tải danh sách phản ánh.');
    }
    return data;
  },

  /**
   * Gửi một phản ánh mới lên hệ thống.
   * @param {Object} complaintData - { title, description, type, city, ward, neighborhood }
   * @returns {Promise<Object>} Bản ghi phản ánh mới được tạo
   */
  async createComplaint(complaintData) {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(complaintData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Không thể gửi phản ánh.');
    }
    return data;
  },
};

export default complaintService;

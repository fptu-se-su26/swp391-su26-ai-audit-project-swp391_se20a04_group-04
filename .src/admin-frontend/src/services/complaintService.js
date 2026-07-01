/**
 * Complaint Service - Frontend
 * Cổng giao tiếp API phản ánh giữa React và Backend Express.
 */
import authService from './authService';

const BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.includes('/api/auth')
      ? import.meta.env.VITE_API_URL.replace('/api/auth', '/api/complaints')
      : `${import.meta.env.VITE_API_URL}/api/complaints`)
  : 'http://localhost:5001/api/complaints';

const ADMIN_BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.includes('/api/auth')
      ? import.meta.env.VITE_API_URL.replace('/api/auth', '/api/admin/complaints')
      : `${import.meta.env.VITE_API_URL}/api/admin/complaints`)
  : 'http://localhost:5001/api/admin/complaints';

const MANAGER_BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.includes('/api/auth')
      ? import.meta.env.VITE_API_URL.replace('/api/auth', '/api/manager/complaints')
      : `${import.meta.env.VITE_API_URL}/api/manager/complaints`)
  : 'http://localhost:5001/api/manager/complaints';


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

/**
 * Tạo header Authorization đính kèm token mới nhất (tự động làm mới).
 * @returns {Promise<Object>} Headers với Bearer token mới
 */
async function getFreshAuthHeaders() {
  const token = await authService.getFreshToken();
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

  /**
   * Lấy danh sách toàn bộ phản ánh cho Admin (hỗ trợ phân trang, tìm kiếm, lọc)
   */
  async getAdminComplaints(page = 1, limit = 10, search = '', role = '') {
    const query = new URLSearchParams({ page, limit, search, role }).toString();
    const response = await fetch(`${ADMIN_BASE_URL}?${query}`, {
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
   * [MANAGER] Lấy danh sách toàn bộ phản ánh của cư dân.
   * @returns {Promise<Array>} Danh sách phản ánh
   */
  async getManagerComplaints() {
    const response = await fetch(MANAGER_BASE_URL, {
      method: 'GET',
      headers: await getFreshAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Không thể tải danh sách phản ánh.');
    }
    return data;
  },

  /**
   * [MANAGER] Cập nhật trạng thái phản ánh.
   * @param {string} complaintId - ID phản ánh
   * @param {string} status - Trạng thái mới: 'in_resolve' | 'resolved' | 'rejected'
   * @param {string} comment - Nhận xét / lý do từ chối
   * @returns {Promise<Object>} Phản ánh đã cập nhật
   */
  async updateComplaintStatus(complaintId, status, comment = '') {
    const response = await fetch(`${MANAGER_BASE_URL}/${complaintId}/status`, {
      method: 'PATCH',
      headers: await getFreshAuthHeaders(),
      body: JSON.stringify({ status, comment }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Không thể cập nhật trạng thái phản ánh.');
    }
    return data;
  },
};

export default complaintService;


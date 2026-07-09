import authService from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

async function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await authService.getFreshToken()}`,
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    if (response.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (response.status === 413) {
      throw new Error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn hoặc ít ảnh hơn.');
    }
    throw new Error('Máy chủ trả về phản hồi không hợp lệ. Kiểm tra backend đang chạy.');
  }
}

const collectorService = {
  async getDashboard(date) {
    const params = date ? `?date=${date}` : '';
    const response = await fetch(`${API_BASE}/api/dashboard/collector${params}`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải dashboard.');
    return data.data;
  },

  async getDailySchedules(date) {
    const params = date ? `?date=${date}` : '';
    const response = await fetch(`${API_BASE}/api/collector/schedules${params}`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải lịch làm việc.');
    return data.data;
  },

  async getAllSchedules() {
    const response = await fetch(`${API_BASE}/api/collector/schedules?all=true`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải lịch làm việc.');
    return data.data;
  },

  async updateStatus({ sourceType, id, action, imageUrls, incidentType, description }) {
    const response = await fetch(`${API_BASE}/api/collector/schedules/${sourceType}/${id}/status`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ action, imageUrls, incidentType, description }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể cập nhật trạng thái.');
    return data;
  },

  async getAssignedReports() {
    const response = await fetch(`${API_BASE}/api/collector/reports`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải phản ánh được giao.');
    return data.data;
  },

  async getReportComments(reportId) {
    const response = await fetch(`${API_BASE}/api/reports/${reportId}/comments`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải lịch sử xử lý.');
    return data.data;
  },

  async updateReportStatus(reportId, { status, message, imageUrls }) {
    const response = await fetch(`${API_BASE}/api/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status, message, imageUrls }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể cập nhật phản ánh.');
    return data;
  },
};

export default collectorService;

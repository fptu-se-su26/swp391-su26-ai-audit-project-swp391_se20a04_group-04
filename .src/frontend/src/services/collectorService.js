import authService from './authService';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
let API_BASE = rawApiUrl.trim();
if (API_BASE.endsWith('/')) {
  API_BASE = API_BASE.slice(0, -1);
}
if (!API_BASE.endsWith('/api')) {
  API_BASE = `${API_BASE}/api`;
}

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
    const response = await fetch(`${API_BASE}/dashboard/collector${params}`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải dashboard.');
    return data.data;
  },

  async getDailySchedules(date) {
    const params = date ? `?date=${date}` : '';
    const response = await fetch(`${API_BASE}/collector/schedules${params}`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải lịch làm việc.');
    return data.data;
  },

  async getAllSchedules() {
    const response = await fetch(`${API_BASE}/collector/schedules?all=true`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải lịch làm việc.');
    return data.data;
  },

  async updateStatus({ sourceType, id, action, imageUrls, incidentType, description }) {
    let response;
    try {
      response = await fetch(`${API_BASE}/collector/schedules/${sourceType}/${id}/status`, {
        method: 'PATCH',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ action, imageUrls, incidentType, description }),
      });
    } catch (networkError) {
      console.error('[CollectorService] Network error on updateStatus:', networkError);
      throw new Error('Không thể kết nối đến máy chủ. Kiểm tra backend đang chạy và thử lại.', { cause: networkError });
    }
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể cập nhật trạng thái.');
    return data;
  },

  async getAssignedReports() {
    const response = await fetch(`${API_BASE}/collector/reports`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải phản ánh được giao.');
    return data.data;
  },

  async getReportComments(reportId) {
    const response = await fetch(`${API_BASE}/reports/${reportId}/comments`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải lịch sử xử lý.');
    return data.data;
  },

  async updateReportStatus(reportId, { status, message, imageUrls }) {
    const response = await fetch(`${API_BASE}/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status, message, imageUrls }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể cập nhật phản ánh.');
    return data;
  },

  async getMyTeam() {
    const response = await fetch(`${API_BASE}/collector/my-team`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải thông tin đội nhóm.');
    return data.data;
  },

  async getMySalary(month, year) {
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (year) params.set('year', year);
    const response = await fetch(`${API_BASE}/collector/salary?${params}`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải thông tin lương.');
    return data.data;
  },

  async getSalaryHistory() {
    const response = await fetch(`${API_BASE}/collector/salary/history`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải lịch sử lương.');
    return data.data;
  },
};

export default collectorService;

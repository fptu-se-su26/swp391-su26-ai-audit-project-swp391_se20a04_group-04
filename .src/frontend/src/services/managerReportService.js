import authService from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authService.getToken()}`,
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Máy chủ trả về phản hồi không hợp lệ.');
  }
}

const managerReportService = {
  async listFeedbackReports(status) {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await fetch(`${API_BASE}/api/manager/feedback-reports${params}`, {
      headers: getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải phản ánh.');
    return data.data;
  },

  async getReportComments(reportId) {
    const response = await fetch(`${API_BASE}/api/manager/feedback-reports/${reportId}/comments`, {
      headers: getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải lịch sử.');
    return data.data;
  },

  async approveReport(reportId, message) {
    const response = await fetch(`${API_BASE}/api/manager/feedback-reports/${reportId}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể duyệt phản ánh.');
    return data;
  },

  async getAttendances(date, month, year) {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (month) params.set('month', month);
    if (year) params.set('year', year);
    const response = await fetch(`${API_BASE}/api/manager/attendances?${params}`, {
      headers: getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải dữ liệu chấm công.');
    return data.data;
  },
};

export default managerReportService;

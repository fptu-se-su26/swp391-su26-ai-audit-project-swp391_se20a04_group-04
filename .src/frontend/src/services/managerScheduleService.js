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
    throw new Error('Máy chủ trả về phản hồi không hợp lệ.');
  }
}

const managerScheduleService = {
  async getPendingCompletions() {
    const response = await fetch(`${API_BASE}/api/manager/schedules/completion-pending`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải tuyến chờ xác nhận.');
    return data.data;
  },

  async approveCompletion(scheduleId, message) {
    const response = await fetch(`${API_BASE}/api/manager/schedules/${scheduleId}/approve-completion`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể xác nhận hoàn thành tuyến.');
    return data;
  },

  async rejectCompletion(scheduleId, message) {
    const response = await fetch(`${API_BASE}/api/manager/schedules/${scheduleId}/reject-completion`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể từ chối xác nhận tuyến.');
    return data;
  },

  async approveDay(date, message) {
    const response = await fetch(`${API_BASE}/api/manager/schedules/approve-day`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ date, message }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể xác nhận toàn bộ tuyến trong ngày.');
    return data;
  },
};

export default managerScheduleService;

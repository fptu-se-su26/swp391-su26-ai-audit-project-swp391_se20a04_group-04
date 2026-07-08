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

const routeService = {
  async getRoutes() {
    const response = await fetch(`${API_BASE}/api/manager/routes`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải danh sách tuyến mẫu.');
    return data;
  },

  async createRoute(routeData) {
    const response = await fetch(`${API_BASE}/api/manager/routes`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(routeData),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tạo tuyến mẫu.');
    return data;
  },

  async updateRoute(routeId, routeData) {
    const response = await fetch(`${API_BASE}/api/manager/routes/${routeId}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(routeData),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể cập nhật tuyến mẫu.');
    return data;
  },

  async deleteRoute(routeId) {
    const response = await fetch(`${API_BASE}/api/manager/routes/${routeId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể xóa tuyến mẫu.');
    return data;
  }
};

export default routeService;

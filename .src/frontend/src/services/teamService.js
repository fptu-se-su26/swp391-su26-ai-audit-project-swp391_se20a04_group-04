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

const teamService = {
  async getTeams() {
    const response = await fetch(`${API_BASE}/api/manager/teams`, {
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải danh sách đội nhóm.');
    return data;
  },

  async createTeam(teamData) {
    const response = await fetch(`${API_BASE}/api/manager/teams`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(teamData),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tạo đội nhóm.');
    return data;
  },

  async updateTeam(teamId, teamData) {
    const response = await fetch(`${API_BASE}/api/manager/teams/${teamId}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(teamData),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể cập nhật đội nhóm.');
    return data;
  },

  async deleteTeam(teamId) {
    const response = await fetch(`${API_BASE}/api/manager/teams/${teamId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Không thể xóa đội nhóm.');
    return data;
  }
};

export default teamService;

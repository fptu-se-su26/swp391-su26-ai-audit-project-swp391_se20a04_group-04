import authService from './authService';

const API_BASE = 'http://localhost:5001/api/admin/users';

const getHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const userService = {
  getUsers: async (search = '', role = '', page = 1, limit = 10) => {
    const queryParams = new URLSearchParams({
      search,
      role,
      page: page.toString(),
      limit: limit.toString(),
    }).toString();
    const response = await fetch(`${API_BASE}?${queryParams}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Không thể lấy danh sách người dùng');
    return response.json();
  },

  createUser: async (userData) => {
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi tạo người dùng');
    }
    return response.json();
  },

  updateUser: async (uid, updateData) => {
    const response = await fetch(`${API_BASE}/${uid}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });
    if (!response.ok) throw new Error('Lỗi khi cập nhật thông tin');
    return response.json();
  },

  deleteUser: async (uid) => {
    const response = await fetch(`${API_BASE}/${uid}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Lỗi khi xóa người dùng');
    return response.json();
  }
};

export default userService;

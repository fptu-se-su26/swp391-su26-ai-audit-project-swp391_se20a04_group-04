import authService from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${authService.getToken()}`,
});

export const getUsers = async (page = 1, limit = 10, search = '', role = '') => {
  const query = new URLSearchParams({ page, limit, search, role }).toString();
  const res = await fetch(`${API_BASE}/api/admin/users?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Lỗi khi tải danh sách người dùng.');
  }
  return res.json();
};

export const createUser = async (userData) => {
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Lỗi khi tạo người dùng mới.');
  return data;
};

export const updateUser = async (uid, userData) => {
  const res = await fetch(`${API_BASE}/api/admin/users/${uid}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Lỗi khi cập nhật người dùng.');
  return data;
};

export const deleteUser = async (uid) => {
  const res = await fetch(`${API_BASE}/api/admin/users/${uid}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa người dùng.');
  return data;
};

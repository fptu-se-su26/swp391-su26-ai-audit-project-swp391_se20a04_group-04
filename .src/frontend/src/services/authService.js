/**
 * Authentication Service for EcoSchedule
 * Handles Login, Register, Logout, and Session Management
 */

const API_BASE_URL = '/api/auth';

const authService = {
  /**
   * Log in user
   * @param {string} email 
   * @param {string} password 
   * @param {boolean} rememberMe 
   * @returns {Promise<object>} User data
   */
  async login(email, password, rememberMe) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }

      // Save token and user information (never save password in localStorage/sessionStorage)
      const storage = rememberMe ? localStorage : sessionStorage;
      if (data.token) {
        storage.setItem('eco_token', data.token);
      }
      if (data.user) {
        storage.setItem('eco_user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
      }
      throw error;
    }
  },

  /**
   * Register a new user (Citizen by default)
   * @param {object} userData 
   * @returns {Promise<object>} Registration response
   */
  async register({ fullName, email, phone, password, address, area }) {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          address,
          area,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Không thể kết nối đến máy chủ.');
      }
      throw error;
    }
  },

  /**
   * Get list of provinces/cities from backend API
   * @returns {Promise<Array>} List of provinces
   */
  async getProvinces() {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/auth', '/location')}/provinces`);
      if (!response.ok) {
        throw new Error('Không thể tải danh sách tỉnh/thành phố');
      }
      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Không thể kết nối đến máy chủ.');
      }
      throw error;
    }
  },

  /**
   * Get list of districts/areas based on province ID from backend API
   * @param {string|number} provinceId 
   * @returns {Promise<Array>} List of districts
   */
  async getDistricts(provinceId) {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/auth', '/location')}/districts?provinceId=${provinceId}`);
      if (!response.ok) {
        throw new Error('Không thể tải danh sách quận/huyện');
      }
      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Không thể kết nối đến máy chủ.');
      }
      throw error;
    }
  },

  /**
   * Log out current user
   */
  logout() {
    // Clear auth data from both storages
    localStorage.removeItem('eco_token');
    localStorage.removeItem('eco_user');
    sessionStorage.removeItem('eco_token');
    sessionStorage.removeItem('eco_user');
  },

  /**
   * Get current logged in user information
   * @returns {object|null}
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('eco_user') || sessionStorage.getItem('eco_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },

  /**
   * Get current token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('eco_token') || sessionStorage.getItem('eco_token');
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  }
};

export default authService;

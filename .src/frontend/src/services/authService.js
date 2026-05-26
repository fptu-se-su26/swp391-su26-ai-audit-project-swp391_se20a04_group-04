/**
 * Authentication Service for EcoSchedule
 * Sử dụng Secure Backend API (Express + Firebase Admin SDK)
 */

import { signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';
const googleProvider = new GoogleAuthProvider();

const authService = {
  /**
   * Đăng ký tài khoản mới và gửi email xác nhận thông qua Backend
   */
  async register({ fullName, email, phone, password, address, role }) {
    try {
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, phone, password, address, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng ký thất bại. Vui lòng thử lại.');
      }

      return { success: true };
    } catch (error) {
      throw new Error(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  },

  /**
   * Đăng nhập thông qua Backend (Yêu cầu email đã xác nhận)
   */
  async login(email, password, rememberMe) {
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại.');
      }

      const { user, token } = data;

      // Lưu thông tin vào storage
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('eco_token', token);
      storage.setItem('eco_user', JSON.stringify(user));

      window.dispatchEvent(new Event('authChange'));
      return { user, token };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Đăng nhập bằng Google
   */
  async loginWithGoogle(rememberMe = true) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        providerId: result.providerId || 'google.com',
      };

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('eco_token', token);
      storage.setItem('eco_user', JSON.stringify(userData));

      window.dispatchEvent(new Event('authChange'));
      return { user: userData, token };
    } catch (error) {
      let message = error.message || 'Đăng nhập Google thất bại.';
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Bạn đã đóng cửa sổ đăng nhập Google.';
      }
      throw new Error(message);
    }
  },

  /**
   * Đăng xuất
   */
  async logout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out from Firebase:', e);
    }
    localStorage.removeItem('eco_token');
    localStorage.removeItem('eco_user');
    sessionStorage.removeItem('eco_token');
    sessionStorage.removeItem('eco_user');
    window.dispatchEvent(new Event('authChange'));
  },

  /**
   * Lấy thông tin người dùng hiện tại từ storage
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
   * Lấy token hiện tại
   */
  getToken() {
    return localStorage.getItem('eco_token') || sessionStorage.getItem('eco_token');
  },

  /**
   * Kiểm tra đã xác thực chưa
   */
  isAuthenticated() {
    return !!this.getToken();
  },
};

export default authService;

/**
 * Authentication Service for EcoSchedule
 * Sử dụng Secure Backend API (Express + Firebase Admin SDK)
 */

import {
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import { auth } from './firebase';

const BACKEND_URL = import.meta.env.VITE_AUTH_URL || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/auth` : 'http://localhost:5001/api/auth');


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

      return { success: true, warning: data.warning };
    } catch (error) {
      throw new Error(error.message || 'Đăng ký thất bại. Vui lòng thử lại.', { cause: error });
    }
  },

  /**
   * Xác nhận mã code (6 số) được gửi qua email sau khi đăng ký
   */
  async verifyEmailCode(email, code) {
    const response = await fetch(`${BACKEND_URL}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Mã xác nhận không hợp lệ.');
    }
    return data;
  },

  /**
   * Gửi lại mã xác nhận qua email
   */
  async resendVerificationCode(email) {
    const response = await fetch(`${BACKEND_URL}/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Không thể gửi lại mã xác nhận.');
    }
    return data;
  },

  /**
   * Đăng nhập thông qua Backend (Yêu cầu email đã xác nhận)
   */
  async login(email, password, rememberMe) {
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
  },

  /**
   * Đăng nhập bằng Google
   */
  async loginWithGoogle(rememberMe = true) {
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      // Gọi Backend để xác thực và đồng bộ dữ liệu Firestore thông qua Admin SDK
      const response = await fetch(`${BACKEND_URL}/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập Google thất bại.');
      }

      const { user, token } = data;

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('eco_token', token);
      storage.setItem('eco_user', JSON.stringify(user));

      window.dispatchEvent(new Event('authChange'));
      return { user, token };
    } catch (error) {
      let message = error.message || 'Đăng nhập Google thất bại.';
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Bạn đã đóng cửa sổ đăng nhập Google.';
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Tài khoản bị tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.', { cause: error });
      }
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Gửi email khôi phục mật khẩu
   */
  async resetPassword(email) {
    try {
      const actionCodeSettings = {
        // Đường dẫn sẽ được mở khi người dùng click vào link trong email
        url: window.location.origin + '/reset-password', 
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      return { success: true };
    } catch (error) {
      let message = 'Gửi yêu cầu thất bại. Vui lòng thử lại sau.';
      if (error.code === 'auth/user-not-found') {
        message = 'Email không tồn tại trong hệ thống.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email không hợp lệ.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
      }
      throw new Error(message, { cause: error });
    }
  },

  /**
   * Xác minh mã khôi phục mật khẩu (oobCode)
   */
  async verifyResetCode(code) {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return email;
    } catch (error) {
      throw new Error('Mã khôi phục không hợp lệ hoặc đã hết hạn.', { cause: error });
    }
  },

  /**
   * Đặt lại mật khẩu mới
   */
  async confirmReset(code, newPassword) {
    try {
      await confirmPasswordReset(auth, code, newPassword);
      return { success: true };
    } catch (error) {
      throw new Error('Không thể đặt lại mật khẩu. Vui lòng thử lại.', { cause: error });
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
    } catch {
      return null;
    }
  },

  /**
   * Lấy token hiện tại (có thể đã hết hạn)
   */
  getToken() {
    return localStorage.getItem('eco_token') || sessionStorage.getItem('eco_token');
  },

  /**
   * Lấy token mới (tự động làm mới nếu đã hết hạn)
   * Firebase ID tokens hết hạn sau 1 giờ — luôn dùng hàm này khi gọi API.
   */
  async getFreshToken() {
    try {
      // Nếu Firebase client đang có user đăng nhập, lấy token mới nhất
      if (auth.currentUser) {
        const freshToken = await auth.currentUser.getIdToken(/* forceRefresh */ false);
        // Cập nhật token trong storage để đồng bộ
        const storage = localStorage.getItem('eco_token') ? localStorage : sessionStorage;
        storage.setItem('eco_token', freshToken);
        return freshToken;
      }
    } catch (e) {
      console.warn('[Auth] Không thể làm mới token Firebase:', e.message);
    }
    // Fallback: trả về token đã lưu (có thể hết hạn)
    return this.getToken();
  },

  /**
   * Kiểm tra đã xác thực chưa
   */
  isAuthenticated() {
    return !!this.getToken();
  },
};

export default authService;

/**
 * Authentication Service for EcoSchedule
 * Sử dụng Secure Backend API (Express + Firebase Admin SDK)
 */

import {
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Tên collection chính trên Firestore
const USERS_COLLECTION = 'users';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';

/**
 * Chuẩn hóa dữ liệu user từ Firestore (hỗ trợ cả tên trường tiếng Việt lẫn tiếng Anh)
 */
function normalizeUser(data, uid) {
  return {
    uid:      data.uid      || uid,
    fullName: data.fullName || data['Họ và tên']   || data['ho_va_ten'] || '',
    email:    data.email    || data['e-mail']       || data['Email']     || '',
    phone:    data.phone    || data['điện thoại']   || data['dien_thoai']|| '',
    address:  data.address  || data['Địa chỉ']      || data['dia_chi']   || '',
    area:     data.area     || data['khu vực']      || data['khu_vuc']   || 'Quận Sơn Trà, Đà Nẵng',
    role:     data.role     || data['vai trò']      || data['Vai trò']   || 'Citizen',
    emailVerified: data.emailVerified ?? true,
  };
}

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
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const firebaseUser = result.user;
      const token = await firebaseUser.getIdToken();

      // Kiểm tra và lấy dữ liệu user từ Firestore
      let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        userDoc = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid));
      }

      let userData = {};
      if (userDoc.exists()) {
        userData = normalizeUser(userDoc.data(), firebaseUser.uid);
      } else {
        // Tạo tài khoản mặc định nếu đăng nhập lần đầu bằng Google
        userData = {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          phone: firebaseUser.phoneNumber || '',
          address: '',
          role: 'Citizen',
          area: 'Quận Sơn Trà, Đà Nẵng',
          emailVerified: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), userData);
      }

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
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Tài khoản bị tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.');
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

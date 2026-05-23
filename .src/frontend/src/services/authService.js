/**
 * Authentication Service for EcoSchedule
<<<<<<< HEAD
 * Sử dụng Firebase Authentication + Firestore
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

// Tên collection - khớp với tên đã tạo trên Firestore
const USERS_COLLECTION = 'người dùng';

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
   * Đăng ký tài khoản mới và gửi email xác nhận
   */
  async register({ fullName, email, phone, password, address, role }) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      // Lưu với field names tiếng Anh (chuẩn) vào cùng collection
      await setDoc(doc(db, USERS_COLLECTION, user.uid), {
        uid: user.uid,
        fullName,
        email,
        phone,
        address,
        role,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        area: 'Quận Sơn Trà, Đà Nẵng',
      });

      await signOut(auth);
      return { success: true };
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email này đã được sử dụng. Vui lòng dùng email khác.');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('Địa chỉ email không hợp lệ.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Mật khẩu quá yếu. Vui lòng dùng mật khẩu ít nhất 6 ký tự.');
      }
      throw new Error(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  },

  /**
   * Đăng nhập - Yêu cầu email đã xác nhận
   */
  async login(email, password, rememberMe) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Kiểm tra email đã xác nhận chưa
      if (!firebaseUser.emailVerified) {
        await signOut(auth);
        throw new Error('Email của bạn chưa được xác nhận. Vui lòng kiểm tra hộp thư và nhấp vào đường link xác nhận trước khi đăng nhập.');
      }

      // Lấy thông tin người dùng từ Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let userData = {};
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        // Dự phòng nếu không có trong Firestore (ví dụ admin tạo thủ công)
        userData = {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || email.split('@')[0],
          email: firebaseUser.email,
          role: 'Citizen',
          area: 'Quận Sơn Trà, Đà Nẵng',
        };
      }

      // Lưu thông tin vào storage
      const storage = rememberMe ? localStorage : sessionStorage;
      const token = await firebaseUser.getIdToken();
      storage.setItem('eco_token', token);
      storage.setItem('eco_user', JSON.stringify(userData));

      window.dispatchEvent(new Event('authChange'));
      return { user: userData, token };
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Tài khoản bị tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.');
      }
      // Re-throw các lỗi tùy chỉnh (như lỗi chưa xác nhận email)
=======
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
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
      throw error;
    }
  },

  /**
<<<<<<< HEAD
   * Đăng xuất
   */
  async logout() {
    await signOut(auth);
=======
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
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
    localStorage.removeItem('eco_token');
    localStorage.removeItem('eco_user');
    sessionStorage.removeItem('eco_token');
    sessionStorage.removeItem('eco_user');
<<<<<<< HEAD
    window.dispatchEvent(new Event('authChange'));
  },

  /**
   * Lấy thông tin người dùng hiện tại từ storage
=======
  },

  /**
   * Get current logged in user information
   * @returns {object|null}
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
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
<<<<<<< HEAD
   * Lấy token hiện tại
=======
   * Get current token
   * @returns {string|null}
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
   */
  getToken() {
    return localStorage.getItem('eco_token') || sessionStorage.getItem('eco_token');
  },

  /**
<<<<<<< HEAD
   * Kiểm tra đã xác thực chưa
   */
  isAuthenticated() {
    return !!this.getToken();
  },
=======
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  }
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
};

export default authService;

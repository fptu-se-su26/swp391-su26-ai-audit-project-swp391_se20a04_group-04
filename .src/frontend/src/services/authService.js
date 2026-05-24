/**
 * Authentication Service for EcoSchedule
 * Sử dụng Firebase Authentication + Firestore
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Tên collection chính trên Firestore
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

      // Lưu với field names tiếng Anh (chuẩn) vào cả hai collection để đảm bảo tương thích hoàn toàn
      const userData = {
        uid: user.uid,
        fullName,
        email,
        phone,
        address,
        role,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        area: 'Quận Sơn Trà, Đà Nẵng',
      };

      // Ghi nhận đồng thời vào hai collection ('người dùng' và 'users') để tương thích với tất cả trang
      await setDoc(doc(db, USERS_COLLECTION, user.uid), userData);
      await setDoc(doc(db, 'users', user.uid), userData);

      await signOut(auth);
      return { success: true };
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email này đã được sử dụng. Vui lòng dùng email khác.') {
          cause : error
        };
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

      // Lấy thông tin người dùng từ Firestore (tìm ở 'users' trước, sau đó 'người dùng' nếu không thấy)
      let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        userDoc = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid));
      }

      let userData = {};
      if (userDoc.exists()) {
        userData = normalizeUser(userDoc.data(), firebaseUser.uid);
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
      throw error;
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

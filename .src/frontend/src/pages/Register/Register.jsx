import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import { ROLES } from '../../constants/roles';
import './Register.css';

export default function Register() {

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  // Validation Logic
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được bỏ trống';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên phải tối thiểu 2 ký tự';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được bỏ trống';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được bỏ trống';
    } else if (!phoneRegex.test(formData.phone.trim().replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại Việt Nam không hợp lệ (10 số, bắt đầu 03/05/07/08/09)';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được bỏ trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có tối thiểu 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu không được bỏ trống';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ không được bỏ trống';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Bạn phải đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await authService.register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim().replace(/\s/g, ''),
        password: formData.password,
        address: formData.address.trim(),
        role: ROLES.RESIDENT, // Luôn đăng ký với vai trò Cư dân
      });

      setSuccessMessage(
        `Đăng ký thành công! Một email xác nhận đã được gửi đến ${formData.email.trim()}. Vui lòng kiểm tra hộp thư và nhấp vào đường link xác nhận để kích hoạt tài khoản trước khi đăng nhập.`
      );
    } catch (err) {
      setApiError(err.message || 'Có lỗi xảy ra trong quá trình đăng ký.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container py-12 px-4 flex items-center justify-center min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
      <div className="register-card w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row">

        {/* Decorative Panel */}
        <div className="register-info-panel md:w-1/3 bg-emerald-700 text-white p-8 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="z-10 flex flex-col items-center gap-2 mt-4">
            <span className="material-symbols-outlined text-emerald-300" style={{ fontSize: '48px' }}>
              recycling
            </span>
            <h2 className="font-headline-md text-headline-md font-bold tracking-wide">EcoSchedule</h2>
            <p className="text-xs text-emerald-200 mt-1">Quận Sơn Trà, Đà Nẵng</p>
          </div>

          <div className="z-10 my-6 hidden md:flex flex-col gap-4">
            {[
              { icon: 'calendar_today', title: 'Tra cứu lịch thu gom', desc: 'Biết chính xác lịch xe rác đến khu vực của bạn' },
              { icon: 'notifications_active', title: 'Nhận thông báo', desc: 'Tự động nhắc nhở trước khi xe thu gom đến' },
              { icon: 'receipt_long', title: 'Quản lý hóa đơn', desc: 'Xem và thanh toán phí vệ sinh môi trường' },
              { icon: 'rate_review', title: 'Gửi phản ánh', desc: 'Phản ánh sự cố liên quan đến thu gom rác' },
            ].map((item) => (
              <div key={item.icon} className="flex items-start gap-3 text-left bg-white/10 rounded-xl p-3 border border-white/20">
                <span className="material-symbols-outlined text-emerald-200 text-xl mt-0.5 flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold">{item.title}</p>
                  <p className="text-[11px] text-emerald-200 mt-0.5 font-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="z-10 text-xs text-emerald-300 hidden md:block">
            © 2026 EcoSchedule Inc.
          </div>
        </div>

        {/* Form Panel */}
        <div className="form-panel md:w-2/3 p-8 overflow-y-auto max-h-[90vh]">
          <div className="text-center md:text-left mb-5">
            <h1 className="font-headline-md text-2xl font-bold text-slate-800 dark:text-white">
              Đăng ký tài khoản
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tạo tài khoản cư dân để tham gia hệ thống quản lý thu gom rác thải tại Quận Sơn Trà.
            </p>
          </div>

          {/* Banners */}
          {successMessage && (
            <div className="alert-success bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 mb-5 flex items-start gap-3 text-sm animate-fade-in">
              <span className="material-symbols-outlined text-xl mt-0.5 flex-shrink-0">mark_email_read</span>
              <span>{successMessage}</span>
            </div>
          )}
          {apiError && (
            <div className="alert-error bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg p-3.5 mb-5 flex items-start gap-2.5 text-sm animate-fade-in">
              <span className="material-symbols-outlined text-lg mt-0.5 flex-shrink-0">error</span>
              <span>{apiError}</span>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Họ và tên */}
              <div className="form-group">
                <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="input-wrapper relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên đầy đủ"
                    className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border ${
                      errors.fullName ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                    } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.fullName}</p>}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="input-wrapper relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@gmail.com"
                      className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border ${
                        errors.email ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                      } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.email}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <div className="input-wrapper relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">phone</span>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="09XXXXXXXX"
                      className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border ${
                        errors.phone ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                      } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="input-wrapper relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Tối thiểu 6 ký tự"
                      className={`w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border ${
                        errors.password ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                      } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                      disabled={isLoading}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none" disabled={isLoading}>
                      <span className="material-symbols-outlined text-lg block">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.password}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nhập lại mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="input-wrapper relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock_reset</span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu"
                      className={`w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border ${
                        errors.confirmPassword ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                      } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                      disabled={isLoading}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none" disabled={isLoading}>
                      <span className="material-symbols-outlined text-lg block">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Địa chỉ */}
              <div className="form-group">
                <label htmlFor="address" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Địa chỉ nhà <span className="text-rose-500">*</span>
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400 normal-case font-normal">(Quận Sơn Trà, Đà Nẵng)</span>
                </label>
                <div className="input-wrapper relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">home</span>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="VD: 123 Nguyễn Thị Định, Phường Mân Thái"
                    className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border ${
                      errors.address ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                    } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                    disabled={isLoading}
                  />
                </div>
                {errors.address && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.address}</p>}
              </div>

              {/* Agree Terms */}
              <div className="form-group pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="mt-1 w-4.5 h-4.5 text-emerald-600 bg-slate-50 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                    disabled={isLoading}
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                    Tôi đồng ý với{' '}
                    <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">Điều khoản sử dụng</a>{' '}
                    và{' '}
                    <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">Chính sách bảo mật</a>{' '}
                    của EcoSchedule Đà Nẵng. <span className="text-rose-500">*</span>
                  </span>
                </label>
                {errors.agreeTerms && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.agreeTerms}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={`w-full py-3 px-4 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-100 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] ${
                  isLoading ? 'opacity-80 cursor-not-allowed active:scale-100' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xử lý đăng ký...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">app_registration</span>
                    <span>Đăng ký tài khoản</span>
                  </>
                )}
              </button>

              <div className="text-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Đã có tài khoản EcoSchedule?{' '}
                  <Link to="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold transition-colors">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>

            </form>
          )}

          {/* Khi đăng ký thành công - hiển thị nút quay về đăng nhập */}
          {successMessage && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                Đi đến trang Đăng nhập
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import { ROLES, normalizeRole } from '../../constants/roles';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);

  // Status States
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear errors when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  // Validation Logic
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được bỏ trống';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được bỏ trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có tối thiểu 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');
    setIsEmailUnverified(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { user } = await authService.login(
        formData.email.trim(),
        formData.password,
        formData.rememberMe
      );

      setSuccessMessage('Đăng nhập thành công! Đang chuyển hướng...');

      // Redirect dựa theo role
      const role = normalizeRole(user?.role);
      let redirectPath = '/';
      if (role === ROLES.MANAGER || role === ROLES.ADMIN) redirectPath = '/dashboard';
      else if (role === ROLES.COLLECTOR) redirectPath = '/collector';

      setTimeout(() => {
        window.dispatchEvent(new Event('authChange'));
        navigate(redirectPath);
      }, 1200);

    } catch (err) {
      let msg = err.message || 'Tên đăng nhập hoặc mật khẩu không đúng.';
      if (err.message === 'Failed to fetch') {
        msg = 'Không thể kết nối đến máy chủ. Vui lòng đảm bảo Backend đang chạy.';
      }
      if (msg.includes('chưa được xác nhận') || msg.includes('xác nhận')) {
        setIsEmailUnverified(true);
      }
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setApiError('');
    setSuccessMessage('');
    setIsEmailUnverified(false);
    setIsGoogleLoading(true);

    try {
      const { user } = await authService.loginWithGoogle(formData.rememberMe);
      setSuccessMessage('Đăng nhập bằng Google thành công! Đang chuyển hướng...');

      // Redirect dựa theo role
      const role = normalizeRole(user?.role);
      let redirectPath = '/';
      if (role === ROLES.MANAGER || role === ROLES.ADMIN) redirectPath = '/dashboard';
      else if (role === ROLES.COLLECTOR) redirectPath = '/collector';

      setTimeout(() => {
        window.dispatchEvent(new Event('authChange'));
        navigate(redirectPath);
      }, 1200);
    } catch (err) {
      let msg = err.message || 'Đăng nhập Google thất bại.';
      if (err.message === 'Failed to fetch') {
        msg = 'Không thể kết nối đến máy chủ. Vui lòng đảm bảo Backend đang chạy.';
      }
      setApiError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="login-container py-16 px-4 flex items-center justify-center min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
      <div className="login-card w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">

        {/* Top Accent Bar */}
        <div className="h-2 bg-emerald-600 w-full"></div>

        {/* Content Panel */}
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <span className="material-symbols-outlined text-2xl font-bold">
                recycling
              </span>
            </div>
            <h1 className="font-headline-md text-2xl font-bold text-slate-800 dark:text-white">
              Đăng nhập EcoSchedule
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 text-center">
              Chào mừng quay trở lại! Đăng nhập để xem lịch và nhận thông báo thu gom rác.
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="alert alert-success bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 mb-5 flex items-start gap-2.5 text-xs animate-fade-in">
              <span className="material-symbols-outlined text-base mt-0.5">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {apiError && (
            <div className={`rounded-lg p-3 mb-5 flex items-start gap-2.5 text-xs animate-fade-in border ${isEmailUnverified
              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
              }`}>
              <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">
                {isEmailUnverified ? 'mark_email_unread' : 'error'}
              </span>
              <div>
                <p>{apiError}</p>
                {isEmailUnverified && (
                  <p className="mt-1.5 font-semibold">
                    Tài khoản của bạn chưa được xác nhận email. Vui lòng kiểm tra hộp thư của bạn.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email Address */}
            <div className="form-group">
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Địa chỉ Email
              </label>
              <div className="input-wrapper relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  mail
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border ${errors.email ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                    } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Mật khẩu
                </label>
              </div>
              <div className="input-wrapper relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu của bạn"
                  className={`w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border ${errors.password ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                    } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                  disabled={isLoading}
                >
                  <span className="material-symbols-outlined text-lg block">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.password}</p>}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4.5 h-4.5 text-emerald-600 bg-slate-50 dark:bg-slate-900 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  disabled={isLoading}
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Ghi nhớ đăng nhập</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3 px-4 mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-100 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] ${isLoading ? 'opacity-85 cursor-not-allowed active:scale-100' : ''
                }`}
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>Đăng nhập</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3 mt-4">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
              <span className="text-xs uppercase tracking-[0.20em] text-slate-400">hoặc</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className={`w-full py-3 px-4 mt-4 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 font-semibold rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-100 flex items-center justify-center gap-2 shadow-sm ${isGoogleLoading ? 'opacity-85 cursor-not-allowed' : ''
                }`}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-700 dark:text-slate-100" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang đăng nhập bằng Google...</span>
                </>
              ) : (
                <>
                  <span className="text-lg font-bold">G</span>
                  <span>Đăng nhập với Google</span>
                </>
              )}
            </button>



          </form>
        </div>

      </div>
    </div>
  );
}

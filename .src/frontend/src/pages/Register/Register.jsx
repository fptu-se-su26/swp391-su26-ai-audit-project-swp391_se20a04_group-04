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
        `Một email xác nhận đã được gửi đến ${formData.email.trim()}. Vui lòng kiểm tra hộp thư và nhấp vào đường link xác nhận để kích hoạt tài khoản trước khi đăng nhập.`
      );
    } catch (err) {
      setApiError(err.message || 'Có lỗi xảy ra trong quá trình đăng ký.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-grow flex flex-col lg:flex-row w-full min-h-[calc(100vh-80px)] overflow-hidden bg-background text-on-background">
      {/* Left Side: Inspiring Imagery & Value Props */}
      <section className="relative hidden lg:flex lg:w-5/12 xl:w-1/2 min-h-[calc(100vh-80px)] overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          data-alt="A cinematic, sun-drenched aerial view of a vibrant, lush green forest interwoven with clean, modern urban architecture. The lighting is high-contrast with deep emerald shadows and bright golden highlights, reflecting a sustainable future where nature and technology coexist. The aesthetic is clean and high-fidelity, following the Eco-Logic system's professional and environmental themes with a palette of deep greens and soft neutrals."
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuASx_-7eAPoj0jEBclvz3XHZXotOaJbdQ8RM1bqZREV8xG1TySHkABXjosgCxOhSV_n7SR_qMYfHAb8qWjenfnR-WpIQPbp7o9OlVMQSS7BI6yOcC0mt9Vajr2Oko8FbhOnpobF49P7Gfh9wKsGmbA694yuix61JWFCR0DuEFLl4_ktXlvPIOB21lcQsfPr3sSsa1Y5DTl641w8rbD-FAB3dvFU-reC0HLCI0Eam-DOg68XcVRsVWka1x77HzV0jG6rI-CKTbG8bwM')"
          }}
        ></div>
        <div className="relative z-10 glass-overlay w-full h-full p-16 flex flex-col justify-center text-white">
          <div className="mb-12">
            <span className="material-symbols-outlined text-6xl mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>
              eco
            </span>
            <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">EcoSchedule</h1>
            <p className="text-xl font-body opacity-90 max-w-lg leading-relaxed">
              Join thousands of residents in Đà Nẵng building a cleaner, smarter city through streamlined waste management.
            </p>
          </div>
          <div className="space-y-8 max-w-md">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md shrink-0">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  calendar_today
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold">Tra cứu lịch thu gom</h3>
                <p className="opacity-80 text-sm">Biết chính xác lịch xe rác đến khu vực của bạn theo thời gian thực.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md shrink-0">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  notifications_active
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold">Nhận thông báo</h3>
                <p className="opacity-80 text-sm">Tự động nhắc nhở trước khi xe thu gom đến 15 phút.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md shrink-0">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  receipt_long
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold">Quản lý hóa đơn</h3>
                <p className="opacity-80 text-sm">Xem và thanh toán phí vệ sinh môi trường trực tuyến minh bạch.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md shrink-0">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  forum
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold">Gửi phản ánh</h3>
                <p className="opacity-80 text-sm">Phản ánh sự cố liên quan đến thu gom rác ngay lập tức.</p>
              </div>
            </div>
          </div>
          <div className="mt-24 pt-12 border-t border-white/20">
            <p className="text-sm opacity-60">© 2026 EcoSchedule. All rights reserved.</p>
          </div>
        </div>
      </section>

      {/* Right Side: Registration Form */}
      <section className="w-full lg:w-7/12 xl:w-1/2 p-6 md:p-12 lg:p-16 xl:p-24 flex items-center justify-center bg-surface">
        <div className="w-full max-w-xl">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-3">Đăng ký tài khoản</h2>
            <p className="text-on-surface-variant font-body">
              Tạo tài khoản cư dân để tham gia hệ thống quản lý thu gom rác thải tại Quận Sơn Trà, Đà Nẵng.
            </p>
          </div>

          {/* Success Banner */}
          {successMessage ? (
            <div className="text-center py-8">
              <div className="alert-success bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-lg p-6 mb-8 flex items-start gap-3 text-sm text-left animate-fade-in">
                <span className="material-symbols-outlined text-3xl text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0">
                  mark_email_read
                </span>
                <div>
                  <h4 className="font-bold text-base mb-1 text-emerald-800 dark:text-emerald-200">Đăng ký thành công!</h4>
                  <p className="leading-relaxed">{successMessage}</p>
                </div>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 py-3 px-8 bg-primary hover:bg-on-primary-fixed-variant text-white font-bold rounded-xl text-sm transition-all shadow-lg active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span>Đi đến trang Đăng nhập</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {apiError && (
                <div className="alert-error bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg p-3.5 flex items-start gap-2.5 text-sm animate-fade-in">
                  <span className="material-symbols-outlined text-lg mt-0.5 flex-shrink-0">error</span>
                  <span>{apiError}</span>
                </div>
              )}

              {/* Họ và Tên */}
              <div className="group">
                <label className="block text-sm font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-2">
                  Họ và Tên *
                </label>
                <div className="relative">
                  <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.fullName ? 'text-error' : 'text-outline'}`}>
                    person
                  </span>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="name"
                    className={`w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 border ${
                      errors.fullName ? 'border-error focus:ring-error' : 'border-outline-variant dark:border-slate-700 focus:ring-primary focus:border-primary'
                    } rounded-lg focus:ring-2 transition-all placeholder:text-outline/60 text-on-background dark:text-white`}
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>
                {errors.fullName && <p className="text-xs text-error mt-1.5 pl-1">{errors.fullName}</p>}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="group">
                  <label className="block text-sm font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.email ? 'text-error' : 'text-outline'}`}>
                      mail
                    </span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="email"
                      className={`w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 border ${
                        errors.email ? 'border-error focus:ring-error' : 'border-outline-variant dark:border-slate-700 focus:ring-primary focus:border-primary'
                      } rounded-lg focus:ring-2 transition-all placeholder:text-outline/60 text-on-background dark:text-white`}
                      placeholder="example@gmail.com"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-error mt-1.5 pl-1">{errors.email}</p>}
                </div>

                {/* Số điện thoại */}
                <div className="group">
                  <label className="block text-sm font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-2">
                    Số điện thoại *
                  </label>
                  <div className="relative">
                    <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.phone ? 'text-error' : 'text-outline'}`}>
                      call
                    </span>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="tel"
                      className={`w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 border ${
                        errors.phone ? 'border-error focus:ring-error' : 'border-outline-variant dark:border-slate-700 focus:ring-primary focus:border-primary'
                      } rounded-lg focus:ring-2 transition-all placeholder:text-outline/60 text-on-background dark:text-white`}
                      placeholder="09XXXXXXXX"
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-error mt-1.5 pl-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mật khẩu */}
                <div className="group">
                  <label className="block text-sm font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-2">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.password ? 'text-error' : 'text-outline'}`}>
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="new-password"
                      className={`w-full h-14 pl-12 pr-12 bg-white dark:bg-slate-900 border ${
                        errors.password ? 'border-error focus:ring-error' : 'border-outline-variant dark:border-slate-700 focus:ring-primary focus:border-primary'
                      } rounded-lg focus:ring-2 transition-all placeholder:text-outline/60 text-on-background dark:text-white`}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary dark:hover:text-primary-fixed focus:outline-none"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-error mt-1.5 pl-1">{errors.password}</p>}
                </div>

                {/* Nhập lại mật khẩu */}
                <div className="group">
                  <label className="block text-sm font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-2">
                    Nhập lại mật khẩu *
                  </label>
                  <div className="relative">
                    <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.confirmPassword ? 'text-error' : 'text-outline'}`}>
                      lock_reset
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="new-password"
                      className={`w-full h-14 pl-12 pr-12 bg-white dark:bg-slate-900 border ${
                        errors.confirmPassword ? 'border-error focus:ring-error' : 'border-outline-variant dark:border-slate-700 focus:ring-primary focus:border-primary'
                      } rounded-lg focus:ring-2 transition-all placeholder:text-outline/60 text-on-background dark:text-white`}
                      placeholder="Nhập lại mật khẩu"
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary dark:hover:text-primary-fixed focus:outline-none"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-error mt-1.5 pl-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Địa chỉ nhà */}
              <div className="group">
                <label className="block text-sm font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-2">
                  Địa chỉ nhà * <span className="normal-case font-medium text-primary dark:text-primary-fixed ml-2">(Quận Sơn Trà, Đà Nẵng)</span>
                </label>
                <div className="relative">
                  <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${errors.address ? 'text-error' : 'text-outline'}`}>
                    home
                  </span>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="street-address"
                    className={`w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 border ${
                      errors.address ? 'border-error focus:ring-error' : 'border-outline-variant dark:border-slate-700 focus:ring-primary focus:border-primary'
                    } rounded-lg focus:ring-2 transition-all placeholder:text-outline/60 text-on-background dark:text-white`}
                    placeholder="VD: 123 Nguyễn Thị Định, Phường Mân Thái"
                  />
                </div>
                {errors.address && <p className="text-xs text-error mt-1.5 pl-1">{errors.address}</p>}
              </div>

              {/* Đồng ý điều khoản */}
              <div className="flex flex-col gap-1 py-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`w-5 h-5 rounded text-primary border-outline focus:ring-primary transition-all cursor-pointer ${
                      errors.agreeTerms ? 'border-error ring-error' : ''
                    }`}
                  />
                  <label className="text-sm text-on-surface-variant dark:text-slate-300 leading-tight cursor-pointer select-none" htmlFor="terms">
                    Tôi đồng ý với <a className="text-primary dark:text-emerald-400 font-bold hover:underline" href="#">Điều khoản sử dụng</a> và <a className="text-primary dark:text-emerald-400 font-bold hover:underline" href="#">Chính sách bảo mật</a> của EcoSchedule Đà Nẵng. *
                  </label>
                </div>
                {errors.agreeTerms && <p className="text-xs text-error mt-1 pl-8">{errors.agreeTerms}</p>}
              </div>

              {/* Submit button */}
              <button
                className={`w-full h-16 bg-primary hover:bg-on-primary-fixed-variant text-white font-bold rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                  isLoading ? 'opacity-80 cursor-not-allowed active:scale-100' : ''
                }`}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      how_to_reg
                    </span>
                    <span>Đăng ký tài khoản</span>
                  </>
                )}
              </button>

              <div className="pt-6 text-center border-t border-outline-variant/30">
                <p className="text-on-surface-variant dark:text-slate-400">
                  Đã có tài khoản EcoSchedule?
                  <Link className="text-primary dark:text-emerald-400 font-bold hover:underline ml-1" to="/login">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

<<<<<<< HEAD
import { useState } from 'react';
=======
import { useState, useEffect } from 'react';
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import './Register.css';

<<<<<<< HEAD
const ROLES = [
  { value: 'Citizen', label: 'Citizen (Cư dân)', desc: 'Người dân sinh sống tại khu vực' },
  { value: 'Garbage Collector', label: 'Garbage Collector (Nhân viên thu gom)', desc: 'Nhân viên thu gom rác thải' },
  { value: 'Collection Company Manager', label: 'Collection Company Manager (Quản lý công ty)', desc: 'Quản lý công ty thu gom rác' },
];

const ADDRESS_LABELS = {
  Citizen: { label: 'Tên hộ gia đình', placeholder: 'VD: Hộ gia đình Nguyễn Văn A' },
  'Garbage Collector': { label: 'Tên tổ dân phố', placeholder: 'VD: Tổ dân phố số 5, P. Mân Thái' },
  'Collection Company Manager': { label: 'Tên công ty', placeholder: 'VD: Công ty TNHH Môi Trường Xanh Đà Nẵng' },
};

export default function Register() {
  const navigate = useNavigate();

=======
export default function Register() {
  const navigate = useNavigate();

  // Form State
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
<<<<<<< HEAD
    role: 'Citizen',
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
=======
    province: '',
    area: '',
    agreeTerms: false,
  });

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

<<<<<<< HEAD
=======
  // Location Selector States
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Fetch provinces on component mount
  useEffect(() => {
    const fetchProvincesList = async () => {
      setIsLoadingLocations(true);
      try {
        const data = await authService.getProvinces();
        setProvinces(data || []);
      } catch (err) {
        setApiError('Không thể kết nối đến máy chủ để tải danh sách tỉnh/thành phố.');
      } finally {
        setIsLoadingLocations(false);
      }
    };
    fetchProvincesList();
  }, []);

  // Handle Province Selection Change
  const handleProvinceChange = async (e) => {
    const provinceId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      province: provinceId,
      area: '', // reset district
    }));
    setDistricts([]);
    setErrors((prev) => ({ ...prev, province: '', area: '' }));

    if (!provinceId) return;

    setIsLoadingLocations(true);
    try {
      const data = await authService.getDistricts(provinceId);
      setDistricts(data || []);
    } catch (err) {
      setApiError('Không thể kết nối đến máy chủ để tải danh sách quận/huyện.');
    } finally {
      setIsLoadingLocations(false);
    }
  };


  // Handle Input Changes
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
<<<<<<< HEAD
      // Reset địa chỉ khi đổi role
      ...(name === 'role' ? { address: '' } : {}),
    }));
=======
    }));
    
    // Clear field-specific error as user types
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

<<<<<<< HEAD
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên phải tối thiểu 2 ký tự';
    }

=======
  // Validation Logic
  const validateForm = () => {
    const newErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được bỏ trống';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên phải tối thiểu 2 ký tự';
    }

    // Email validation
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được bỏ trống';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }

<<<<<<< HEAD
=======
    // Phone number validation (Vietnam 10-digit number)
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được bỏ trống';
    } else if (!phoneRegex.test(formData.phone.trim().replace(/\s/g, ''))) {
<<<<<<< HEAD
      newErrors.phone = 'Số điện thoại không hợp lệ (10 số, bắt đầu 03/05/07/08/09)';
    }

=======
      newErrors.phone = 'Số điện thoại Việt Nam không hợp lệ (phải gồm 10 số)';
    }

    // Password validation
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được bỏ trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có tối thiểu 6 ký tự';
    }

<<<<<<< HEAD
=======
    // Confirm password validation
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu không được bỏ trống';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

<<<<<<< HEAD
    if (!formData.address.trim()) {
      newErrors.address = `${ADDRESS_LABELS[formData.role]?.label || 'Địa chỉ'} không được bỏ trống`;
    }

=======
    // Residence address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ cư trú không được bỏ trống';
    }

    // Province validation
    if (!formData.province) {
      newErrors.province = 'Vui lòng chọn tỉnh/thành phố';
    }

    // Area (District) validation
    if (!formData.area) {
      newErrors.area = 'Vui lòng chọn quận/huyện';
    }

    // Terms agreement validation
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Bạn phải đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

<<<<<<< HEAD
=======
  // Submit Handler
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

<<<<<<< HEAD
    if (!validateForm()) return;

    setIsLoading(true);
=======
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
    try {
      await authService.register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim().replace(/\s/g, ''),
        password: formData.password,
        address: formData.address.trim(),
<<<<<<< HEAD
        role: formData.role,
      });

      setSuccessMessage(
        `Đăng ký thành công! Một email xác nhận đã được gửi đến ${formData.email.trim()}. Vui lòng kiểm tra hộp thư và nhấp vào đường link xác nhận để kích hoạt tài khoản trước khi đăng nhập.`
      );
=======
        province: formData.province,
        area: formData.area,
      });

      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng sang trang Đăng nhập...');
      
      // Delay navigation to let the user see the success message
      setTimeout(() => {
        navigate('/login');
      }, 2000);
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
    } catch (err) {
      setApiError(err.message || 'Có lỗi xảy ra trong quá trình đăng ký.');
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
  const addrConfig = ADDRESS_LABELS[formData.role] || ADDRESS_LABELS['Citizen'];
  const selectedRoleInfo = ROLES.find((r) => r.value === formData.role);

  return (
    <div className="register-container py-12 px-4 flex items-center justify-center min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
      <div className="register-card w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row">

        {/* Decorative Panel */}
        <div className="register-info-panel md:w-1/3 bg-emerald-700 text-white p-8 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

=======
  return (
    <div className="register-container py-12 px-4 flex items-center justify-center min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
      <div className="register-card w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row">
        
        {/* Decorative Nature/Eco Panel */}
        <div className="register-info-panel md:w-1/3 bg-emerald-700 text-white p-8 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
          <div className="z-10 flex flex-col items-center gap-2 mt-4">
            <span className="material-symbols-outlined text-emerald-300" style={{ fontSize: '48px' }}>
              recycling
            </span>
            <h2 className="font-headline-md text-headline-md font-bold tracking-wide">EcoSchedule</h2>
<<<<<<< HEAD
            <p className="text-xs text-emerald-200 mt-1">Quận Sơn Trà, Đà Nẵng</p>
          </div>

          <div className="z-10 my-6 hidden md:flex flex-col gap-3">
            {ROLES.map((r) => (
              <div
                key={r.value}
                className={`rounded-xl p-3 text-left transition-all cursor-default border ${
                  formData.role === r.value
                    ? 'bg-white/20 border-white/50'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <p className="text-xs font-bold">{r.label.split(' (')[0]}</p>
                <p className="text-xs text-emerald-200 mt-0.5 font-light">{r.desc}</p>
              </div>
            ))}
=======
            <p className="text-xs text-emerald-200 mt-2">Hành động nhỏ, Hành tinh xanh</p>
          </div>

          <div className="z-10 my-8 hidden md:block">
            <p className="text-sm text-emerald-100 font-light leading-relaxed">
              Tham gia cộng đồng EcoSchedule để cùng phân loại và quản lý rác thải sinh hoạt hiệu quả, chung tay bảo vệ môi trường Đà Nẵng.
            </p>
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
          </div>

          <div className="z-10 text-xs text-emerald-300 hidden md:block">
            © 2026 EcoSchedule Inc.
          </div>
        </div>

        {/* Form Panel */}
<<<<<<< HEAD
        <div className="form-panel md:w-2/3 p-8 overflow-y-auto max-h-[90vh]">
          <div className="text-center md:text-left mb-5">
=======
        <div className="form-panel md:w-2/3 p-8">
          <div className="text-center md:text-left mb-6">
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
            <h1 className="font-headline-md text-2xl font-bold text-slate-800 dark:text-white">
              Đăng ký EcoSchedule
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
<<<<<<< HEAD
              Tạo tài khoản để tham gia hệ thống quản lý thu gom rác thải tại Quận Sơn Trà.
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
=======
              Đăng ký tài khoản để đóng góp xây dựng thành phố xanh, sạch, đẹp.
            </p>
          </div>

          {/* Success & API Error Banners */}
          {successMessage && (
            <div className="alert alert-success bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3.5 mb-5 flex items-start gap-2.5 text-sm animate-fade-in">
              <span className="material-symbols-outlined text-lg mt-0.5">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {apiError && (
            <div className="alert alert-error bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg p-3.5 mb-5 flex items-start gap-2.5 text-sm animate-fade-in">
              <span className="material-symbols-outlined text-lg mt-0.5">error</span>
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
              <span>{apiError}</span>
            </div>
          )}

<<<<<<< HEAD
          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ROLE SELECTOR */}
              <div className="form-group">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Vai trò <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.role === r.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={formData.role === r.value}
                        onChange={handleChange}
                        className="accent-emerald-600"
                        disabled={isLoading}
                      />
                      <div>
                        <p className={`text-sm font-semibold ${formData.role === r.value ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {r.label.split(' (')[0]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

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

              {/* Địa chỉ - dynamic theo role */}
              <div className="form-group">
                <label htmlFor="address" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {addrConfig.label} <span className="text-rose-500">*</span>
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400 normal-case font-normal">(Quận Sơn Trà, Đà Nẵng)</span>
                </label>
                <div className="input-wrapper relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    {formData.role === 'Collection Company Manager' ? 'business' : formData.role === 'Garbage Collector' ? 'location_on' : 'home'}
                  </span>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={addrConfig.placeholder}
                    className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border ${
                      errors.address ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
=======
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Họ và tên */}
            <div className="form-group">
              <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <div className="input-wrapper relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  person
                </span>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên của bạn"
                  className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border ${
                    errors.fullName ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                  } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                  disabled={isLoading}
                />
              </div>
              {errors.fullName && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.fullName}</p>}
            </div>

            {/* Email & Phone Number Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email <span className="text-rose-500">*</span>
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
                    className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border ${
                      errors.email ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
                    } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                    disabled={isLoading}
                  />
                </div>
<<<<<<< HEAD
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
                    className="mt-1 w-4 h-4 text-emerald-600 bg-slate-50 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
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
=======
                {errors.email && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.email}</p>}
              </div>

              {/* Số điện thoại */}
              <div className="form-group">
                <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <div className="input-wrapper relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    phone
                  </span>
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

            {/* Passwords Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Mật khẩu */}
              <div className="form-group">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
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
                    placeholder="Tối thiểu 6 ký tự"
                    className={`w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border ${
                      errors.password ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
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

              {/* Xác nhận mật khẩu */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Xác nhận mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="input-wrapper relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock_reset
                  </span>
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
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    disabled={isLoading}
                  >
                    <span className="material-symbols-outlined text-lg block">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Địa chỉ cư trú */}
            <div className="form-group">
              <label htmlFor="address" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Địa chỉ cư trú <span className="text-rose-500">*</span>
              </label>
              <div className="input-wrapper relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  home
                </span>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ví dụ: 123 Nguyễn Văn Linh"
                  className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border ${
                    errors.address ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                  } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                  disabled={isLoading}
                />
              </div>
              {errors.address && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.address}</p>}
            </div>

            {/* Tỉnh/Thành phố & Quận/Huyện Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tỉnh/Thành phố */}
              <div className="form-group">
                <label htmlFor="province" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tỉnh / Thành phố <span className="text-rose-500">*</span>
                </label>
                <div className="input-wrapper relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                    location_city
                  </span>
                  <select
                    id="province"
                    name="province"
                    value={formData.province}
                    onChange={handleProvinceChange}
                    className={`w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border ${
                      errors.province ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                    } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all appearance-none cursor-pointer`}
                    disabled={isLoading || isLoadingLocations}
                  >
                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                    {provinces.map((prov) => (
                      <option key={prov.id || prov.code} value={prov.id || prov.code}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
                    arrow_drop_down
                  </span>
                </div>
                {errors.province && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.province}</p>}
              </div>

              {/* Quận / Huyện */}
              <div className="form-group">
                <label htmlFor="area" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Quận / Huyện <span className="text-rose-500">*</span>
                </label>
                <div className="input-wrapper relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                    map
                  </span>
                  <select
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border ${
                      errors.area ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                    } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all appearance-none cursor-pointer`}
                    disabled={isLoading || isLoadingLocations || !formData.province}
                  >
                    <option value="">-- Chọn Quận/Huyện --</option>
                    {districts.map((dist) => (
                      <option key={dist.id || dist.code} value={dist.name}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
                    arrow_drop_down
                  </span>
                </div>
                {errors.area && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.area}</p>}
              </div>
            </div>


            {/* Checkbox Đồng ý điều khoản */}
            <div className="form-group pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="mt-1 w-4.5 h-4.5 text-emerald-600 bg-slate-50 dark:bg-slate-900 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  disabled={isLoading}
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                  Tôi đồng ý với{' '}
                  <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                    Điều khoản sử dụng
                  </a>{' '}
                  và{' '}
                  <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                    Chính sách bảo mật
                  </a>{' '}
                  của EcoSchedule Đà Nẵng. <span className="text-rose-500">*</span>
                </span>
              </label>
              {errors.agreeTerms && <p className="text-xs text-rose-500 mt-1 pl-1">{errors.agreeTerms}</p>}
            </div>

            {/* Nút Đăng ký */}
            <button
              type="submit"
              className={`w-full py-3 px-4 mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-100 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] ${
                isLoading ? 'opacity-85 cursor-not-allowed active:scale-100' : ''
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

            {/* Link chuyển sang trang đăng nhập */}
            <div className="text-center mt-6 pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đã có tài khoản EcoSchedule?{' '}
                <Link to="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold transition-colors">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>

          </form>
        </div>

>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
      </div>
    </div>
  );
}

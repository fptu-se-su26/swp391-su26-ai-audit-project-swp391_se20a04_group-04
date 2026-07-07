import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import { ROLES, normalizeRole } from '../constants/roles';
import './Header.css';

// Ánh xạ loại thông báo sang icon và màu sắc
const TYPE_ICON = {
  schedule: { icon: 'local_shipping', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  payment:  { icon: 'payments',       color: 'text-amber-600',   bg: 'bg-amber-500/10'   },
  complaint:{ icon: 'report_problem', color: 'text-orange-600',  bg: 'bg-orange-500/10'  },
  system:   { icon: 'notifications_active', color: 'text-sky-600', bg: 'bg-sky-500/10'   },
};

function timeAgo(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function getRoleLabel(role) {
  const r = normalizeRole(role);
  if (r === ROLES.ADMIN) return 'Quản trị hệ thống';
  if (r === ROLES.MANAGER) return 'Quản lý';
  if (r === ROLES.COLLECTOR) return 'Nhân viên thu gom';
  return 'Cư dân';
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const userMenuRef = useRef(null);

  // Lấy thông báo từ API
  const fetchNotifications = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch {
      // Im lặng khi lỗi để không làm header bị đổ vỡ
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) fetchNotifications();
      else { setUnreadCount(0); setNotifications([]); }
    };
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('notificationsUpdated', fetchNotifications);

    const interval = setInterval(() => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      if (!currentUser) { setUnreadCount(0); setNotifications([]); }
    }, 3000);

    if (authService.isAuthenticated()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications();
    }

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('notificationsUpdated', fetchNotifications);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = async () => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const isOpening = !showDropdown;
    setShowDropdown(isOpening);
    setShowUserMenu(false);

    if (isOpening) {
      setDropdownLoading(true);
      await fetchNotifications();
      setDropdownLoading(false);
    }
  };

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch { /* bỏ qua */ }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await authService.logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const navLinkClass = (path) =>
    `font-label-md text-label-md transition-colors ${
      isActive(path)
        ? 'text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed pb-1'
        : 'text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed'
    }`;

  const previewNotifications = notifications.slice(0, 5);
  const userRole = user ? normalizeRole(user.role) : null;
  const isManager = userRole === ROLES.MANAGER || userRole === ROLES.ADMIN;
  const isCollector = userRole === ROLES.COLLECTOR;
  const isManagerOrCollector = isManager || isCollector;
  const dashboardPath = isCollector ? '/collector' : '/dashboard';

  return (
    <header className="header bg-surface dark:bg-inverse-surface shadow-sm docked full-width">
      <div className="flex justify-between items-center px-margin-desktop w-full max-w-container-max-width mx-auto h-20">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-primary-fixed" style={{ fontSize: '32px' }}>
            recycling
          </span>
          <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">
            EcoSchedule
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link className={navLinkClass('/tra-cuu')} to="/tra-cuu">Tra cứu lịch</Link>
          <Link className={navLinkClass('/thong-bao')} to="/thong-bao">Thông báo</Link>
          <Link className={navLinkClass('/thanh-toan')} to="/thanh-toan">Thanh toán</Link>
          {userRole !== ROLES.ADMIN && (
            <>
              <Link className={navLinkClass('/huong-dan')} to="/huong-dan">Hướng dẫn phân loại</Link>
              <Link className={navLinkClass('/phan-anh')} to="/phan-anh">Gửi phản ánh</Link>
            </>
          )}
          {userRole === ROLES.ADMIN && (
            <Link className={navLinkClass('/quan-ly')} to="/quan-ly">Quản lý</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">

          {/* ===== CHUÔNG THÔNG BÁO ===== */}
          <div className="relative">
            <button
              ref={bellRef}
              onClick={handleBellClick}
              className={`bell-icon relative material-symbols-outlined header__icon ${showDropdown ? 'bell-active text-emerald-600' : 'text-primary dark:text-primary-fixed'}`}
              title="Thông báo"
            >
              notifications
              {unreadCount > 0 && (
                <span className="badge-unread absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none ring-2 ring-white dark:ring-slate-900">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown thông báo */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="notification-dropdown absolute right-0 top-[calc(100%+12px)] w-[380px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      notifications
                    </span>
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Thông báo</h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-xs font-bold rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  <Link
                    to="/thong-bao"
                    onClick={() => setShowDropdown(false)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Xem tất cả →
                  </Link>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {dropdownLoading ? (
                    <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                      <svg className="animate-spin h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm">Đang tải...</span>
                    </div>
                  ) : previewNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                      <span className="material-symbols-outlined text-3xl opacity-30">notifications_off</span>
                      <p className="text-xs">Chưa có thông báo nào</p>
                    </div>
                  ) : (
                    previewNotifications.map((n) => {
                      const conf = TYPE_ICON[n.type] || TYPE_ICON.system;
                      return (
                        <div
                          key={n.id}
                          onClick={() => { setShowDropdown(false); if (n.link) navigate(n.link); }}
                          className={`notification-item flex items-start gap-3 px-5 py-4 cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-b-0 ${
                            !n.is_read
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                          }`}
                        >
                          <div className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center ${conf.bg} ${conf.color}`}>
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {conf.icon}
                            </span>
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className={`text-xs leading-snug line-clamp-2 ${!n.is_read ? 'font-semibold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                              {n.title || n.content}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(n.sent_at)}</p>
                          </div>
                          <div className="flex-shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
                            {!n.is_read ? (
                              <>
                                <div className="w-2 h-2 bg-rose-500 rounded-full" />
                                <button
                                  onClick={(e) => handleMarkRead(e, n.id)}
                                  title="Đánh dấu đã đọc"
                                  className="text-slate-300 hover:text-emerald-500 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                </button>
                              </>
                            ) : (
                              <span className="material-symbols-outlined text-slate-200 dark:text-slate-600 text-sm">check_circle</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80">
                  <Link
                    to="/thong-bao"
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">open_in_full</span>
                    Mở trung tâm thông báo
                  </Link>
                </div>
              </div>
            )}
          </div>
          {/* ===== KẾT THÚC CHUÔNG ===== */}

          {/* ===== USER MENU / NÚT ĐĂNG NHẬP ===== */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              {/* Nút avatar kích hoạt dropdown */}
              <button
                onClick={() => { setShowUserMenu((prev) => !prev); setShowDropdown(false); }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-800 transition-all"
                title={`Tài khoản: ${user.fullName || user.email}`}
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(user.fullName || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate hidden md:block">
                  {user.fullName || user.email}
                </span>
                <span className={`material-symbols-outlined text-slate-400 text-base transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Dropdown user menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 top-[calc(100%+10px)] w-64 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-fade-in"
                  style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.14)' }}
                >
                  {/* Thông tin user */}
                  <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                      {(user.fullName || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.fullName || 'Người dùng'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    {isManagerOrCollector && (
                      <button
                        onClick={() => { setShowUserMenu(false); navigate(dashboardPath); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-base text-slate-400">dashboard</span>
                        {isCollector ? 'Lịch làm việc' : 'Bảng điều khiển'}
                      </button>
                    )}
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/thong-bao'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-base text-slate-400">notifications</span>
                      Thông báo của tôi
                      {unreadCount > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] font-bold rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {userRole !== ROLES.ADMIN && !isCollector && (
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/phan-anh'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-base text-slate-400">rate_review</span>
                        Phản ánh của tôi
                      </button>
                    )}
                  </div>

                  {/* Đăng xuất */}
                  <div className="border-t border-slate-100 dark:border-slate-700 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left font-semibold"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="header__cta bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-md text-label-md hover:opacity-90 active:opacity-80 transition-all"
            >
              Đăng nhập
            </button>
          )}
          {/* ===== KẾT THÚC USER MENU ===== */}

        </div>
      </div>
    </header>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import { timeAgo } from '../pages/Notifications/notificationUtils';
import Footer from './Footer';

export default function CollectorLayout({ children, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Notifications state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  const notifDropdownRef = useRef(null);
  const bellRef = useRef(null);
  const userMenuRef = useRef(null);

  const currentUser = user || authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

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
      // Quiet fail
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    window.addEventListener('notificationsUpdated', fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationsUpdated', fetchNotifications);
    };
  }, [fetchNotifications]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      ) {
        setShowNotificationDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = async () => {
    const isOpening = !showNotificationDropdown;
    setShowNotificationDropdown(isOpening);
    setUserDropdownOpen(false);

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
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch {
      /* ignore */
    }
  };

  const navItems = [
    { path: '/collector', label: 'Lịch & Tuyến thu gom', icon: 'calendar_today' },
    { path: '/collector/attendance', label: 'Chấm công & Ca làm', icon: 'timer' },
    { path: '/collector/reports', label: 'Phản ánh phân công', icon: 'chat_bubble' },
    { path: '/thong-bao', label: 'Trung tâm thông báo', icon: 'notifications' },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const previewNotifications = notifications.slice(0, 5);

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body relative">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Navigation Drawer (Sidebar) */}
      <aside
        className={`fixed left-0 top-0 w-64 h-full border-r border-outline-variant bg-surface-container-low z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-lg ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">eco</span>
              <span className="text-xl font-bold text-primary font-headline">EcoSchedule</span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              title="Thu gọn menu"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item, idx) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={`${item.path}-${idx}`}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 rounded-lg ${
                    isActive
                      ? 'text-primary font-bold border-r-4 border-primary bg-surface-container-high'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="font-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-outline-variant">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              {currentUser ? getInitials(currentUser.fullName) : 'E'}
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{currentUser?.fullName || 'EcoSchedule Collector'}</p>
              <p className="text-xs text-on-surface-variant">Collector Portal</p>
            </div>
          </div>
          <p className="text-[10px] text-outline text-right uppercase tracking-widest">v1.2.0</p>
        </div>
      </aside>

      {/* Top App Bar */}
      <header
        className={`flex justify-between items-center w-full px-6 py-4 z-40 fixed top-0 bg-surface-container-lowest shadow-sm border-b border-outline-variant/50 transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-72' : 'lg:pl-6'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors flex items-center justify-center text-on-surface border border-outline-variant/60 shadow-xs"
            title={sidebarOpen ? 'Thu gọn menu' : 'Mở menu bên trái'}
          >
            <span className="material-symbols-outlined">
              {sidebarOpen ? 'close' : 'menu'}
            </span>
          </button>
          <Link to="/" className="text-xl font-bold text-primary font-headline">
            EcoSchedule
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell & Dropdown */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={handleBellClick}
              className="relative p-2 rounded-full hover:bg-surface-container transition-transform active:scale-95 text-on-surface-variant flex items-center justify-center"
              title="Thông báo"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-error text-on-error text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotificationDropdown && (
              <div
                ref={notifDropdownRef}
                className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl border border-outline-variant shadow-2xl z-50 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-outline-variant/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">notifications</span>
                    <h3 className="font-bold text-on-surface text-base">Thông báo mới</h3>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-xs font-bold rounded-full">
                      {unreadCount} chưa đọc
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/30">
                  {dropdownLoading ? (
                    <div className="py-8 text-center text-sm text-outline">Đang tải thông báo...</div>
                  ) : previewNotifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-outline">Không có thông báo nào.</div>
                  ) : (
                    previewNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setShowNotificationDropdown(false);
                          navigate('/thong-bao');
                        }}
                        className={`p-4 cursor-pointer transition-colors flex items-start gap-3 ${
                          n.is_read
                            ? 'bg-surface hover:bg-surface-container-low'
                            : 'bg-primary-container/10 hover:bg-primary-container/20'
                        }`}
                      >
                        <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                          notifications_active
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${n.is_read ? 'text-on-surface-variant' : 'font-bold text-on-surface'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-outline mt-1">{timeAgo(n.sent_at)}</p>
                        </div>
                        {!n.is_read && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkRead(e, n.id)}
                            title="Đánh dấu đã đọc"
                            className="text-primary hover:scale-110 transition-transform"
                          >
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-outline-variant/60 bg-surface-container-low text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationDropdown(false);
                      navigate('/thong-bao');
                    }}
                    className="w-full py-2 text-sm font-bold text-primary hover:bg-primary-container/20 rounded-xl transition-colors"
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setShowNotificationDropdown(false);
              }}
              className="flex items-center gap-3 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant hover:border-primary transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-xs font-bold">
                {currentUser ? getInitials(currentUser.fullName) : 'TN'}
              </div>
              <span className="font-label text-sm hidden sm:inline font-semibold text-on-surface">
                {currentUser?.fullName || 'Nhân viên thu gom'}
              </span>
              <span className="material-symbols-outlined text-sm text-outline">keyboard_arrow_down</span>
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl border border-outline-variant shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-outline-variant">
                  <p className="text-xs font-bold text-on-surface">{currentUser?.fullName}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{currentUser?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container/20 flex items-center gap-2 font-semibold"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={`pt-20 min-h-screen bg-surface flex flex-col justify-between transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        }`}
      >
        <div>{children}</div>
        <Footer isInsideCollectorLayout={true} />
      </main>
    </div>
  );
}


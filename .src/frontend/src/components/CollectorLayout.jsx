import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Footer from './Footer';

export default function CollectorLayout({ children, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const currentUser = user || authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/collector', label: 'Dashboard', icon: 'dashboard' },
    { path: '/collector', label: 'Schedules', icon: 'calendar_today' },
    { path: '/collector/reports', label: 'Phản ánh', icon: 'chat_bubble' },
    { path: '/thong-bao', label: 'Thông báo', icon: 'notifications_active' },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

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
              const isActive =
                item.path === '/collector' && idx < 2
                  ? location.pathname === '/collector'
                  : location.pathname === item.path;

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
              <p className="text-sm font-bold text-on-surface">{currentUser?.fullName || 'EcoSchedule Admin'}</p>
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
          <button
            type="button"
            onClick={() => navigate('/thong-bao')}
            className="relative p-2 rounded-full hover:bg-surface-container transition-transform active:scale-95 text-on-surface-variant"
            title="Thông báo"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-3 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant hover:border-primary transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-xs font-bold">
                {currentUser ? getInitials(currentUser.fullName) : 'TN'}
              </div>
              <span className="font-label text-sm hidden sm:inline font-semibold text-on-surface">
                {currentUser?.fullName || 'Tuấn Nguyễn Văn'}
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

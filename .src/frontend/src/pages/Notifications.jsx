import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';
import authService from '../services/authService';

const TYPE_CONFIG = {
  schedule: { icon: 'local_shipping', color: 'text-emerald-600', bg: 'bg-emerald-500/10', label: 'Lịch thu gom' },
  payment:  { icon: 'payments',       color: 'text-amber-600',   bg: 'bg-amber-500/10',   label: 'Thanh toán' },
  system:   { icon: 'notifications_active', color: 'text-sky-600', bg: 'bg-sky-500/10',   label: 'Hệ thống' },
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

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'schedule', 'payment', 'system'
  
  // Settings States
  const [settings, setSettings] = useState({ email: true, sms: false, push: true });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchNotifications = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchSettings = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    try {
      const data = await notificationService.getNotificationSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, [fetchNotifications, fetchSettings]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      // Notify other components like Header
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái thông báo');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật tất cả thông báo');
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    setSettingsSuccess('');
    try {
      await notificationService.updateNotificationSettings(settings);
      setSettingsSuccess('Lưu cấu hình thành công!');
      setTimeout(() => setSettingsSuccess(''), 3000);
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (activeCategory === 'all') return true;
    return n.type === activeCategory;
  });

  // Paginated notifications
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage) || 1;
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <main className="max-w-container-max-width mx-auto px-margin-desktop py-12">
      {/* Page Header & Breadcrumb */}
      <div className="flex flex-col gap-6 mb-10">
        <nav className="flex items-center gap-2 text-label-md text-on-surface-variant">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold text-slate-800 dark:text-white">Trung tâm thông báo</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-slate-800 dark:text-white mb-2">Trung tâm thông báo</h1>
            <p className="text-body-md text-slate-500 dark:text-slate-400">Cập nhật những tin tức mới nhất về lịch trình và dịch vụ của bạn.</p>
          </div>
          <button
            onClick={handleMarkAllAsRead}
            disabled={notifications.filter(n => !n.is_read).length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-label-md transition-all shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">done_all</span>
            Đánh dấu đã đọc tất cả
          </button>
        </div>
        {/* Horizontal Tabs Filter */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => { setActiveCategory('all'); setCurrentPage(1); }}
            className={`px-6 py-3 border-b-2 font-semibold transition-all cursor-pointer ${
              activeCategory === 'all' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-emerald-600'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => { setActiveCategory('schedule'); setCurrentPage(1); }}
            className={`px-6 py-3 border-b-2 font-semibold transition-all cursor-pointer ${
              activeCategory === 'schedule' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-emerald-600'
            }`}
          >
            Lịch thu gom
          </button>
          <button
            onClick={() => { setActiveCategory('payment'); setCurrentPage(1); }}
            className={`px-6 py-3 border-b-2 font-semibold transition-all cursor-pointer ${
              activeCategory === 'payment' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-emerald-600'
            }`}
          >
            Thanh toán
          </button>
          <button
            onClick={() => { setActiveCategory('system'); setCurrentPage(1); }}
            className={`px-6 py-3 border-b-2 font-semibold transition-all cursor-pointer ${
              activeCategory === 'system' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-emerald-600'
            }`}
          >
            Hệ thống
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-10 gap-8">
        {/* Left Column: Notification List */}
        <div className="md:col-span-7 flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-800 border border-outline-variant/30 rounded-xl">
              <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : paginatedNotifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-12 text-center border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500">
              <span className="material-symbols-outlined text-4xl opacity-35 mb-2 block">notifications_off</span>
              <p className="text-sm">Không có thông báo nào trong danh mục này.</p>
            </div>
          ) : (
            paginatedNotifications.map(n => {
              const conf = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
              return (
                <div
                  key={n.id}
                  onClick={() => { if (n.link) navigate(n.link); }}
                  className={`relative bg-white dark:bg-slate-800 p-6 rounded-xl border flex gap-5 group transition-all cursor-pointer ${
                    !n.is_read
                      ? 'border-emerald-600/30 shadow-[0_4px_20px_rgba(0,109,55,0.05)] bg-emerald-50/5 dark:bg-emerald-950/5'
                      : 'border-slate-100 dark:border-slate-700/50 opacity-80 hover:opacity-100'
                  } hover:border-emerald-600/30`}
                >
                  {!n.is_read && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-600 rounded-full"></div>
                  )}
                  <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center ${conf.bg} ${conf.color}`}>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {conf.icon}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1 pr-4">
                      <h3 className={`font-semibold text-slate-850 dark:text-white group-hover:text-emerald-600 transition-colors ${!n.is_read ? 'font-bold' : ''}`}>
                        {n.title}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">{timeAgo(n.sent_at)}</span>
                    </div>
                    <p className="text-sm text-slate-650 dark:text-slate-300 leading-relaxed">{n.content}</p>
                    <div className="mt-4 flex flex-wrap gap-3 items-center">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                        Gửi bởi: {n.sender_name} ({n.sender_role})
                      </span>
                      {n.link && (
                        <button className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded text-xs font-semibold hover:bg-emerald-200 transition-colors flex items-center gap-1">
                          Xem chi tiết
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      )}
                      {!n.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(n.id);
                          }}
                          className="px-3 py-1 border border-slate-200 hover:border-emerald-600 dark:border-slate-700 text-slate-500 hover:text-emerald-600 rounded text-xs font-semibold transition-colors ml-auto flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 py-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm block">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-405 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm block">chevron_right</span>
              </button>
            </div>
          )}
        </div>
        {/* Right Column: Settings */}
        <aside className="md:col-span-3">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 sticky top-24 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-emerald-600">settings_suggest</span>
              <h2 className="font-semibold text-slate-800 dark:text-white text-md">Tùy chọn nhận thông báo</h2>
            </div>
            {settingsSuccess && (
              <div className="mb-4 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900 rounded-lg text-xs text-center font-semibold animate-fade-in">
                {settingsSuccess}
              </div>
            )}
            <div className="flex flex-col gap-6">
              {/* Email Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col pr-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">Nhận qua Email</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Bản tin định kỳ &amp; hóa đơn</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    checked={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.checked })}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              {/* SMS Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col pr-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">Nhận qua SMS</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Thông báo khẩn &amp; nhắc lịch</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    checked={settings.sms}
                    onChange={(e) => setSettings({ ...settings, sms: e.target.checked })}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              {/* Push Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col pr-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">Nhận Push</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Cảnh báo trực tiếp trên app</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    checked={settings.push}
                    onChange={(e) => setSettings({ ...settings, push: e.target.checked })}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={handleSaveSettings}
                  disabled={settingsLoading}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {settingsLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  Lưu cài đặt
                </button>
              </div>
            </div>
            {/* Promo/Help Card in Sidebar */}
            <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">help_outline</span>
                <div>
                  <h4 className="text-xs text-emerald-700 font-bold mb-1">Cần hỗ trợ?</h4>
                  <p className="text-[11px] text-slate-500 leading-normal dark:text-slate-400">Nếu bạn không nhận được thông báo, hãy kiểm tra phần cài đặt hệ thống trên điện thoại.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

/**
 * index.jsx - Trang Trung Tâm Thông Báo
 * Chứa toàn bộ logic (state, API calls, handlers).
 * Giao diện được ủy quyền cho các sub-component:
 *   - NotificationCard     → hiển thị từng thẻ thông báo
 *   - NotificationSettings → sidebar cài đặt kênh nhận thông báo
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import authService from '../../services/authService';
import { ROLES, normalizeRole } from '../../constants/roles';
import NotificationCard from './NotificationCard';
import NotificationSettings from './NotificationSettings';
import AdminNotifications from '../Admin/AdminNotifications';
import { TABS } from './notificationUtils';

export default function Notifications() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // ─── State ────────────────────────────────────────────────────────────────
  const [notifications, setNotifications]   = useState([]);
  const [settings, setSettings]             = useState({ email: true, sms: false, push: true });
  const [activeTab, setActiveTab]           = useState('all');
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved]   = useState(false);

  // ─── Kiểm tra đăng nhập ───────────────────────────────────────────────────
  useEffect(() => {
    if (!authService.isAuthenticated()) navigate('/login');
  }, [navigate]);

  // ─── Tải dữ liệu ──────────────────────────────────────────────────────────
  // Dùng useRef để giữ reference tới loadData mà không cần useCallback
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Tải thông báo — lỗi ở đây mới hiện thông báo lỗi cho người dùng
      const notifs = await notificationService.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }

    try {
      // Tải cài đặt — lỗi ở đây chỉ giữ nguyên giá trị mặc định, không crash trang
      const cfg = await notificationService.getNotificationSettings();
      setSettings(cfg);
    } catch {
      // Im lặng: Dùng settings mặc định { email: true, sms: false, push: true }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    window.addEventListener('notificationsUpdated', loadData);
    return () => window.removeEventListener('notificationsUpdated', loadData);
  }, []);

  // ─── Kiểm tra quyền ADMIN sau khi tất cả Hooks đã được gọi ───────────────
  if (currentUser && normalizeRole(currentUser.role) === ROLES.ADMIN) {
    return <AdminNotifications />;
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  /** Đánh dấu một thông báo đã đọc */
  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      console.error('Lỗi đánh dấu đọc:', err.message);
    }
  };

  /** Đánh dấu tất cả đã đọc */
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      console.error('Lỗi đánh dấu đọc tất cả:', err.message);
    }
  };

  /** Click vào card thông báo: đánh dấu đọc rồi điều hướng */
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) await handleMarkAsRead(notification.id);
    if (notification.link) navigate(notification.link);
  };

  /** Cập nhật một khóa trong settings */
  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  /** Lưu cài đặt lên Firestore */
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      await notificationService.updateNotificationSettings(settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      console.error('Lỗi lưu cài đặt:', err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── Dữ liệu được tính toán ───────────────────────────────────────────────
  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeTab);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="max-w-container-max-width mx-auto px-margin-desktop py-12">

      {/* Breadcrumb + Tiêu đề trang */}
      <div className="flex flex-col gap-6 mb-10">
        <nav className="flex items-center gap-2 text-label-md text-on-surface-variant">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Trung tâm thông báo</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
              Trung tâm thông báo
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Cập nhật những tin tức mới nhất về lịch trình và dịch vụ của bạn.
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  {unreadCount} chưa đọc
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">done_all</span>
              Đánh dấu đã đọc tất cả
            </button>
          </div>
        </div>

        {/* Tab Bộ Lọc */}
        <div className="flex border-b border-outline-variant overflow-x-auto whitespace-nowrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 border-b-2 font-medium transition-all ${
                activeTab === tab.key
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-60">
                  ({notifications.filter((n) => n.type === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Layout 2 cột */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-gutter">

        {/* Cột trái: Danh sách thông báo */}
        <div className="md:col-span-7 flex flex-col gap-4">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
              <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-body-md">Đang tải thông báo...</p>
            </div>
          )}

          {/* Lỗi */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900">
              <span className="material-symbols-outlined text-4xl text-rose-500">error_outline</span>
              <p className="text-body-md text-rose-700 dark:text-rose-300 font-semibold">{error}</p>
              <button onClick={loadData} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-sm font-semibold hover:opacity-90 transition-all">
                Thử lại
              </button>
            </div>
          )}

          {/* Danh sách rỗng */}
          {!loading && !error && filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl opacity-30">notifications_off</span>
              <p className="text-body-md">Không có thông báo nào trong mục này.</p>
            </div>
          )}

          {/* Danh sách thông báo — dùng NotificationCard */}
          {!loading && !error && filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={handleNotificationClick}
            />
          ))}
        </div>

        {/* Cột phải: Sidebar cài đặt — dùng NotificationSettings */}
        <NotificationSettings
          settings={settings}
          onSettingChange={handleSettingChange}
          onSave={handleSaveSettings}
          saving={savingSettings}
          saved={settingsSaved}
        />
      </div>
    </main>
  );
}

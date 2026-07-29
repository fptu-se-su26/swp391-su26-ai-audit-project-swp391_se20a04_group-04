import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import collectorService from '../../services/collectorService';
import notificationService from '../../services/notificationService';
import { ROLES, normalizeRole } from '../../constants/roles';
import CollectionRouteMap from '../../components/CollectionRouteMap';
import CollectorLayout from '../../components/CollectorLayout';
import { filesToEvidenceUrls } from '../../utils/imageUtils';
import { timeAgo } from '../Notifications/notificationUtils';

const INCIDENT_TYPES = [
  { value: 'vehicle_breakdown', label: 'Xe hỏng / sự cố phương tiện' },
  { value: 'road_blocked', label: 'Đường tắc / không thể di chuyển' },
  { value: 'overload', label: 'Điểm tập kết quá tải' },
  { value: 'hazardous_waste', label: 'Rác nguy hại sai quy định' },
  { value: 'other', label: 'Sự cố khác' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'in_progress') return { label: 'Đang thu gom', className: 'bg-sky-100 text-sky-800 border-sky-300' };
  if (s === 'completed_pending_approval') return { label: 'Chờ Manager xác nhận', className: 'bg-amber-100 text-amber-800 border-amber-300' };
  if (s === 'completed') return { label: 'Đã hoàn thành', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (s === 'delayed') return { label: 'Bị hoãn', className: 'bg-rose-100 text-rose-800 border-rose-300' };
  return { label: 'Đã xác nhận', className: 'bg-primary-container/20 text-primary border-primary/30' };
}

function canStart(status) {
  return ['assigned', 'confirmed', 'published', 'updated', 'active', 'planned'].includes((status || '').toLowerCase());
}

function canComplete(status) {
  return (status || '').toLowerCase() === 'in_progress';
}

export default function CollectorDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => authService.getCurrentUser());
  const [dateFilter, setDateFilter] = useState('');
  const [summary, setSummary] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [assignedReports, setAssignedReports] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [incidentForm, setIncidentForm] = useState({
    incidentType: 'vehicle_breakdown',
    description: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const role = normalizeRole(user.role);
    if (role !== ROLES.COLLECTOR) {
      navigate(role === ROLES.MANAGER || role === ROLES.ADMIN ? '/dashboard' : '/');
    }
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardData, scheduleData, reportData, notifData] = await Promise.all([
        collectorService.getDashboard(todayISO()),
        collectorService.getAllSchedules(),
        collectorService.getAssignedReports().catch(() => []),
        notificationService.getNotifications().catch(() => []),
      ]);
      setSummary(dashboardData);
      const items = scheduleData.items || [];
      setSchedules(items);
      setAssignedReports(Array.isArray(reportData) ? reportData : reportData?.data || []);
      setRecentNotifications(Array.isArray(notifData) ? notifData : []);
      setSelectedItem((prev) => {
        if (!prev) return items[0] || null;
        return items.find((i) => i.id === prev.id && i.sourceType === prev.sourceType) || items[0] || null;
      });
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredSchedules = useMemo(() => {
    if (!dateFilter) return schedules;
    return schedules.filter((item) => item.date === dateFilter);
  }, [schedules, dateFilter]);

  const groupedSchedules = useMemo(() => {
    const groups = new Map();
    filteredSchedules.forEach((item) => {
      const key = item.date || 'unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredSchedules]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleAction = async (action, extra = {}) => {
    if (!selectedItem) return;
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      const result = await collectorService.updateStatus({
        sourceType: selectedItem.sourceType,
        id: selectedItem.id,
        action,
        ...extra,
      });
      setMessage(result.message || 'Cập nhật thành công.');
      if (action === 'complete') {
        setMessage('Đã gửi hoàn thành tuyến. Chờ Manager xác nhận.');
      }
      if (action === 'incident' && result.data?.notificationResult?.notified > 0) {
        setMessage(`Đã báo sự cố. Thông báo đã gửi tới ${result.data.notificationResult.notified} cư dân.`);
      }
      setShowCompleteModal(false);
      setShowIncidentModal(false);
      setEvidenceFiles([]);
      setIncidentForm({ incidentType: 'vehicle_breakdown', description: '' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Thao tác thất bại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSubmit = async () => {
    if (evidenceFiles.length === 0) {
      setError('Vui lòng chọn ít nhất 1 ảnh minh chứng.');
      return;
    }
    const imageUrls = await filesToEvidenceUrls(evidenceFiles);
    await handleAction('complete', { imageUrls });
  };

  const handleIncidentSubmit = async () => {
    await handleAction('incident', {
      incidentType: incidentForm.incidentType,
      description: incidentForm.description.trim(),
      imageUrls: evidenceFiles.length
        ? await filesToEvidenceUrls(evidenceFiles)
        : [],
    });
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)] bg-surface">
        <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const badge = selectedItem ? getStatusBadge(selectedItem.status) : null;
  const modalOpen = showCompleteModal || showIncidentModal;

  return (
    <CollectorLayout user={user}>
      <div className="max-w-[1280px] mx-auto p-6 lg:p-12 space-y-8 animate-fade-in">

        {/* Global Feedback Banner */}
        {error && (
          <div className="rounded-xl border border-error-container bg-error-container/20 p-4 text-sm text-error font-medium flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-error hover:opacity-80">✕</button>
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-primary-container bg-primary-container/20 p-4 text-sm text-primary font-medium flex items-center justify-between">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')} className="text-primary hover:opacity-80">✕</button>
          </div>
        )}

        {/* Collector Hero Card */}
        <section className="bg-white rounded-xl p-8 shadow-sm border border-outline-variant flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center overflow-hidden border-2 border-primary-container">
                <div className="w-full h-full bg-primary text-white text-2xl font-bold flex items-center justify-center">
                  {(user.fullName || 'C')[0].toUpperCase()}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-md">
                <span className="material-symbols-outlined text-xs">local_shipping</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl lg:text-2xl font-bold text-on-surface font-headline">
                  {user.fullName} <span className="text-sm text-outline font-normal">(DE190362)</span>
                </h2>
                <span className="px-3 py-1 bg-primary-container/20 text-primary font-bold text-xs rounded-full uppercase tracking-wider">
                  Collector
                </span>
              </div>
              <p className="text-on-surface-variant flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-sm">mail</span>
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className={`flex-1 md:flex-none px-6 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm ${
                !dateFilter
                  ? 'bg-primary text-white hover:opacity-90'
                  : 'bg-surface-container-low text-on-surface border border-outline-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined">task_alt</span>
              Tất cả lịch
            </button>
            <div className="relative flex-1 md:w-48">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border-outline-variant rounded-lg bg-surface-container-lowest px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                title="Lọc theo ngày"
              />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-3 text-error bg-error-container/20 rounded-lg hover:bg-error-container/40 transition-colors"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </section>

        {/* Stats Overview Bento */}
        {summary && (
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform">
              <p className="text-outline text-xs font-bold uppercase mb-2">Lịch Hôm Nay</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-on-surface">{summary.todayAssignments}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform">
              <p className="text-outline text-xs font-bold uppercase mb-2">Đang Thực Hiện</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-secondary">{summary.inProgressAssignments}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform">
              <p className="text-outline text-xs font-bold uppercase mb-2">Chờ Xác Nhận</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-tertiary">{summary.pendingApprovalAssignments ?? 0}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform">
              <p className="text-outline text-xs font-bold uppercase mb-2">Đã Hoàn Thành</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">{summary.completedAssignments}</span>
              </div>
            </div>
            {/* Phản ánh mới Card */}
            <Link
              to="/collector/reports"
              className="bg-white p-6 rounded-xl border-2 border-primary/20 shadow-sm hover:-translate-y-1 transition-transform bg-primary-container/5 block"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-primary text-xs font-bold uppercase">Phản ánh mới</p>
                <span className="w-2 h-2 bg-error rounded-full" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-primary">{summary.pendingReports ?? 0}</span>
              </div>
              <span className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                Xem ngay <span className="material-symbols-outlined text-sm">trending_flat</span>
              </span>
            </Link>
            {/* Thông báo Card */}
            <Link
              to="/thong-bao"
              className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform block"
            >
              <p className="text-outline text-xs font-bold uppercase mb-2">Thông báo</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-on-surface">5</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">3 tin nhắn hệ thống</p>
            </Link>
          </section>
        )}

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Route List & Alerts */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-outline text-xs font-bold uppercase">Lịch Làm Việc</p>
                  <h3 className="text-xl font-bold font-headline">
                    {dateFilter ? formatDateLabel(dateFilter) : 'Tất cả lịch được gán'}
                  </h3>
                  <p className="text-on-surface-variant text-sm">
                    {filteredSchedules.length} tuyến{dateFilter ? '' : ` / ${schedules.length} tổng`}
                  </p>
                </div>
                <p className="text-primary font-bold text-sm">
                  {dateFilter ? formatDateLabel(dateFilter) : 'Hôm nay'}
                </p>
              </div>

              {loading ? (
                <p className="text-sm text-on-surface-variant py-4">Đang tải lịch thu gom...</p>
              ) : filteredSchedules.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-outline-variant text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl opacity-40">event_busy</span>
                  <p className="mt-2 text-sm font-medium">
                    {dateFilter ? 'Không có lịch thu gom trong ngày này.' : 'Chưa có lịch thu gom được gán.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedSchedules.map(([groupDate, items]) => (
                    <div key={groupDate} className="space-y-3">
                      {!dateFilter && (
                        <p className="text-xs font-bold text-primary sticky top-0 bg-surface py-1">
                          {formatDateLabel(groupDate)}
                        </p>
                      )}
                      {items.map((item) => {
                        const itemBadge = getStatusBadge(item.status);
                        const isSelected = selectedItem?.id === item.id && selectedItem?.sourceType === item.sourceType;
                        return (
                          <button
                            key={`${item.sourceType}-${item.id}`}
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            className={`w-full text-left rounded-xl p-5 relative overflow-hidden transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-primary-container/5 border-2 border-primary shadow-sm'
                                : 'bg-white border-outline-variant hover:border-primary/50'
                            }`}
                          >
                            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="text-base font-bold text-on-surface">{item.routeName}</h4>
                                <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-1">
                                  <span className="material-symbols-outlined text-sm">schedule</span>
                                  {item.startTime && item.endTime ? `${item.startTime} – ${item.endTime}` : 'Giờ chưa xác định'}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase border ${itemBadge.className}`}>
                                {itemBadge.label}
                              </span>
                            </div>
                            {item.ward && (
                              <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                                <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                                {item.neighborhood ? `${item.neighborhood}, ${item.ward}` : item.ward}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trung tâm thông báo (Notification Center) */}
            <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">notifications</span>
                  Trung tâm thông báo
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/thong-bao')}
                  className="text-primary text-xs font-bold hover:underline"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="divide-y divide-outline-variant">
                {recentNotifications.length > 0 ? (
                  recentNotifications.slice(0, 3).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => navigate('/thong-bao')}
                      className="p-4 hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <div className="flex gap-3 items-start">
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notif.is_read ? 'font-bold text-on-surface' : 'font-medium text-on-surface-variant'}`}>
                            {notif.title || notif.content}
                          </p>
                          {notif.title && (
                            <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{notif.content}</p>
                          )}
                          <p className="text-[10px] text-outline mt-1 font-bold">
                            {timeAgo(notif.sent_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl opacity-30">notifications_off</span>
                    <p className="mt-1 text-xs">Chưa có thông báo mới nào.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Route Details & Map */}
          <div className="lg:col-span-8 space-y-6">
            {selectedItem ? (
              <>
                {/* Route Detail Header */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-outline-variant">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-outline text-xs font-bold uppercase">Chi tiết tuyến</p>
                      <h3 className="text-2xl lg:text-3xl font-bold font-headline text-on-surface">
                        {selectedItem.routeName}
                      </h3>
                    </div>
                    {badge && (
                      <span className={`px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider border ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <div>
                      <p className="text-outline text-xs font-bold uppercase mb-1">Giờ dự kiến</p>
                      <p className="font-bold text-on-surface">
                        {selectedItem.startTime && selectedItem.endTime
                          ? `${selectedItem.startTime} – ${selectedItem.endTime}`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-outline text-xs font-bold uppercase mb-1">Loại rác</p>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-secondary" />
                        <p className="font-bold text-on-surface">{selectedItem.wasteType || 'Recycling'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-outline text-xs font-bold uppercase mb-1">Phân công</p>
                      <p className="font-bold text-secondary">
                        {selectedItem.teamId ? 'Đi theo Đội' : 'Đi 1 mình'}
                      </p>
                    </div>
                    <div>
                      <p className="text-outline text-xs font-bold uppercase mb-1">Xe / Phương tiện</p>
                      <p className="font-bold text-on-surface">{selectedItem.vehicleCode || 'TRUCK-402'}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-outline-variant">
                    <p className="text-outline text-xs font-bold uppercase mb-1">Khu vực</p>
                    <p className="font-bold text-lg text-on-surface">{selectedItem.ward || 'Phường An Hải Tây'}</p>
                  </div>

                  {selectedItem.notes && (
                    <div className="mt-4 p-3 bg-surface-container-low rounded-xl text-sm text-on-surface-variant">
                      <p className="font-semibold text-xs text-outline uppercase">Ghi chú:</p>
                      <p className="mt-0.5">{selectedItem.notes}</p>
                    </div>
                  )}

                  {selectedItem.incident && (
                    <div className="mt-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-800">
                      <p className="font-bold">Sự cố đã báo:</p>
                      <p className="mt-1">{selectedItem.incident.description}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 pt-6 border-t border-outline-variant flex flex-wrap gap-3">
                    {canStart(selectedItem.status) && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleAction('start')}
                        className="px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">play_arrow</span>
                        Bắt đầu thu gom
                      </button>
                    )}
                    {canComplete(selectedItem.status) && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => { setShowCompleteModal(true); setEvidenceFiles([]); setError(''); }}
                        className="px-6 py-2.5 bg-primary-container text-on-primary-container font-bold text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        Hoàn thành
                      </button>
                    )}
                    {!['completed', 'completed_pending_approval', 'delayed'].includes((selectedItem.status || '').toLowerCase()) && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          setShowIncidentModal(true);
                          setEvidenceFiles([]);
                          setIncidentForm({ incidentType: 'vehicle_breakdown', description: '' });
                          setError('');
                        }}
                        className="px-6 py-2.5 bg-error-container/40 text-error font-bold text-sm rounded-lg hover:bg-error-container/60 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">report</span>
                        Báo sự cố
                      </button>
                    )}
                  </div>
                </div>

                {/* Map Container */}
                {!modalOpen && (
                  <div className="bg-white rounded-xl overflow-hidden shadow-md border border-outline-variant">
                    <div className="p-6 border-b border-outline-variant">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-outline text-xs font-bold uppercase">Google Maps</p>
                        <span className="material-symbols-outlined text-outline">open_in_full</span>
                      </div>
                      <h4 className="text-lg font-bold">{selectedItem.routeName}</h4>
                      <p className="text-on-surface-variant text-sm">
                        Nhân viên: {user.fullName} (DE190362)
                      </p>
                    </div>
                    <div className="p-2">
                      <CollectionRouteMap
                        title={selectedItem.routeName}
                        collectorName={user.fullName}
                        routePoints={selectedItem.routePoints?.length ? selectedItem.routePoints : undefined}
                        readOnly
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center text-on-surface-variant border border-outline-variant">
                <span className="material-symbols-outlined text-5xl opacity-40">map</span>
                <p className="mt-3 font-semibold text-base">Chọn một tuyến để xem chi tiết và cập nhật tiến độ.</p>
              </div>
            )}

            {/* Resident Feedback Section (Consolidated View) */}
            <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                <div>
                  <p className="text-outline text-xs font-bold uppercase">Resident Feedback</p>
                  <h3 className="text-xl font-bold font-headline">Phản ánh mới cần xử lý</h3>
                </div>
                <Link
                  to="/collector/reports"
                  className="px-4 py-2 text-primary border border-primary rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors"
                >
                  Xem tất cả phản ánh
                </Link>
              </div>
              <div className="p-6 space-y-4">
                {assignedReports.length > 0 ? (
                  assignedReports.slice(0, 2).map((rep) => (
                    <div
                      key={rep.id}
                      onClick={() => navigate('/collector/reports')}
                      className="flex items-start gap-4 p-4 border border-outline-variant rounded-lg bg-surface-container-lowest hover:border-primary transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center text-error">
                        <span className="material-symbols-outlined">report</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-on-surface">{rep.title || rep.category}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-error-container text-on-error-container rounded uppercase">
                            {rep.severity || 'Khẩn cấp'}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant mt-1">{rep.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-outline flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {rep.ward || 'Phường An Hải Bắc'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl opacity-30">assignment_turned_in</span>
                    <p className="mt-2 text-sm font-semibold">Hiện chưa có phản ánh nào được giao</p>
                    <p className="text-xs text-outline mt-1">Các phản ánh mới từ cư dân sẽ xuất hiện tại đây khi Manager phân công cho bạn.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Modals */}
        {showCompleteModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl relative">
              <h3 className="text-lg font-bold text-on-surface font-headline">Xác nhận hoàn thành</h3>
              <p className="text-sm text-on-surface-variant mt-2">Upload ít nhất 1 ảnh minh chứng sau khi thu gom.</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
                className="mt-4 w-full text-sm border border-outline-variant rounded-lg p-2"
              />
              {evidenceFiles.length > 0 && (
                <p className="text-xs text-primary mt-2 font-semibold">Đã chọn {evidenceFiles.length} ảnh.</p>
              )}
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleCompleteSubmit}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50"
                >
                  Xác nhận hoàn thành
                </button>
              </div>
            </div>
          </div>
        )}

        {showIncidentModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl relative">
              <h3 className="text-lg font-bold text-on-surface font-headline">Báo sự cố</h3>
              <p className="text-sm text-on-surface-variant mt-2">
                Mô tả sự cố từ 20–1000 ký tự. Lịch sẽ chuyển sang trạng thái bị hoãn.
              </p>
              <select
                value={incidentForm.incidentType}
                onChange={(e) => setIncidentForm((prev) => ({ ...prev, incidentType: e.target.value }))}
                className="mt-4 w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
              >
                {INCIDENT_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <textarea
                value={incidentForm.description}
                onChange={(e) => setIncidentForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Mô tả chi tiết sự cố..."
                className="mt-3 w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
              />
              <p className="text-xs text-outline mt-1">{incidentForm.description.length}/1000 ký tự</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
                className="mt-3 w-full text-sm border border-outline-variant rounded-lg p-2"
              />
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleIncidentSubmit}
                  className="px-4 py-2 rounded-lg bg-error text-white text-sm font-bold disabled:opacity-50"
                >
                  Gửi báo cáo
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </CollectorLayout>
  );
}

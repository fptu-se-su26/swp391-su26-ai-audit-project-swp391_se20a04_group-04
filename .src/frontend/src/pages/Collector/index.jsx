import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import authService from '../../services/authService';
import collectorService from '../../services/collectorService';
import notificationService from '../../services/notificationService';
import { ROLES, normalizeRole } from '../../constants/roles';
import CollectionRouteMap from '../../components/CollectionRouteMap';
import CollectorLayout from '../../components/CollectorLayout';
import { filesToEvidenceUrls } from '../../utils/imageUtils';
import { timeAgo } from '../Notifications/notificationUtils';

const locales = { vi };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), getDay, locales });

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
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
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('week');

  // Deny-week state
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyWeekLabel, setDenyWeekLabel] = useState('');
  const [denyReason, setDenyReason] = useState('');
  const [denyLoading, setDenyLoading] = useState(false);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [incidentForm, setIncidentForm] = useState({
    incidentType: 'vehicle_breakdown',
    description: '',
  });

  // Team & Salary state
  const [myTeams, setMyTeams] = useState([]);
  const [currentSalary, setCurrentSalary] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);

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

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [dashboardData, scheduleData, reportData, notifData, teamData, salaryData, salaryHistData] = await Promise.all([
        collectorService.getDashboard(todayISO()),
        collectorService.getAllSchedules(),
        collectorService.getAssignedReports().catch(() => []),
        notificationService.getNotifications().catch(() => []),
        collectorService.getMyTeam().catch(() => []),
        collectorService.getMySalary().catch(() => null),
        collectorService.getSalaryHistory().catch(() => []),
      ]);
      setError('');
      setSummary(dashboardData);
      const items = scheduleData.items || [];
      setSchedules(items);
      setAssignedReports(Array.isArray(reportData) ? reportData : reportData?.data || []);
      setRecentNotifications(Array.isArray(notifData) ? notifData : []);
      setMyTeams(Array.isArray(teamData) ? teamData : []);
      setCurrentSalary(salaryData);
      setSalaryHistory(Array.isArray(salaryHistData) ? salaryHistData : []);
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

  // Payload chart: completions per day this week
  const payloadChartData = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const count = schedules.filter(s => {
        const done = ['completed', 'completed_pending_approval'].includes((s.status || '').toLowerCase());
        return done && s.date === iso;
      }).length;
      days.push({ day: d.toLocaleDateString('vi-VN', { weekday: 'short' }), tuyến: count });
    }
    return days;
  }, [schedules]);

  // Calendar events
  const calendarEvents = useMemo(() => schedules.map(s => {
    const startDate = s.date ? new Date(`${s.date}T${s.time || s.startTime || '07:00'}:00`) : new Date();
    // If no endTime or same as startTime, show a 1-hour block
    const hasDistinctEnd = s.endTime && s.endTime !== s.startTime && s.endTime !== (s.time || s.startTime || '07:00');
    const endDate = hasDistinctEnd
      ? new Date(`${s.date}T${s.endTime}:00`)
      : addHours(startDate, 1);
    return {
      id: s.id,
      title: s.routeName || s.route_name || 'Tuyến thu gom',
      start: startDate,
      end: endDate,
      resource: s,
      _hasDistinctEnd: hasDistinctEnd,
    };
  }), [schedules]);

  // Custom format to show only start time when no distinct end
  const calendarFormats = useMemo(() => ({
    eventTimeRangeFormat: ({ start, end }, culture, localizer) => {
      const startStr = localizer.format(start, 'HH:mm', culture);
      const endStr = localizer.format(end, 'HH:mm', culture);
      if (startStr === endStr) return startStr;
      // Check if it's auto-generated 1-hour block
      const diff = end.getTime() - start.getTime();
      if (diff === 3600000) return startStr; // 1 hour = auto block
      return `${startStr} – ${endStr}`;
    },
  }), []);

  // ISO week helper
  function getISOWeekLabel(date = new Date()) {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const y = d.getFullYear();
    const yearStart = new Date(y, 0, 1);
    const wk = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${y}-W${String(wk).padStart(2, '0')}`;
  }

  const handleDenyWeek = async () => {
    if (!denyReason.trim()) return;
    setDenyLoading(true);
    setError('');
    try {
      const token = await authService.getFreshToken();
      const res = await fetch(`${API_BASE}/api/collector/deny-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isoWeek: denyWeekLabel, reason: denyReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể từ chối lịch tuần.');
      setMessage(`Đã từ chối ${data.denied} lịch trong tuần ${denyWeekLabel}. Manager sẽ được thông báo.`);
      setShowDenyModal(false);
      setDenyReason('');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDenyLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="space-y-6">

          {/* Top bar: deny week + payload chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => { setDenyWeekLabel(getISOWeekLabel()); setShowDenyModal(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-all"
              >
                <span className="material-symbols-outlined text-sm">block</span>
                Từ chối tuần này
              </button>
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant p-4 shadow-sm">
              <p className="text-xs font-bold text-outline uppercase tracking-widest mb-2">Tuyến hoàn thành tuần này</p>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={payloadChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="tuyến" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full-width Calendar */}
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 border-b border-outline-variant flex items-center justify-between">
              <div>
                <p className="text-outline text-xs font-bold uppercase">Lịch Làm Việc</p>
                <p className="text-sm text-on-surface-variant">{schedules.length} tuyến được gán — nhấp vào tuyến để xem chi tiết</p>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3">
                <span className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-on-surface-variant">Đang tải lịch thu gom...</p>
              </div>
            ) : (
              <div className="p-3">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 560 }}
                  date={calendarDate}
                  onNavigate={(newDate) => setCalendarDate(newDate)}
                  view={calendarView}
                  onView={(newView) => setCalendarView(newView)}
                  views={['week', 'month']}
                  culture="vi"
                  messages={{ week: 'Tuần', month: 'Tháng', today: 'Hôm nay', previous: '‹', next: '›', noEventsInRange: 'Không có lịch trong khoảng này.' }}
                  onSelectEvent={ev => {
                    setSelectedItem(ev.resource);
                    setTimeout(() => document.getElementById('collector-detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                  }}
                  selected={selectedItem ? calendarEvents.find(e => e.id === selectedItem.id) : null}
                  eventPropGetter={ev => {
                    const s = (ev.resource?.status || '').toLowerCase();
                    let bg = '#6366f1'; // default: assigned (purple)
                    if (s === 'completed' && ev.resource?.managerConfirmed) {
                      bg = '#10b981'; // green — manager confirmed
                    } else if (s === 'completed_pending_approval' || (s === 'completed' && !ev.resource?.managerConfirmed)) {
                      bg = '#f59e0b'; // amber — waiting for manager
                    } else if (s === 'in_progress') {
                      bg = '#3b82f6'; // blue — in progress
                    } else if (s === 'denied_by_collector') {
                      bg = '#ef4444'; // red — denied
                    } else if (s === 'delayed') {
                      bg = '#f97316'; // orange — delayed
                    }
                    const isSelected = selectedItem?.id === ev.resource?.id;
                    return { style: { backgroundColor: bg, borderRadius: '6px', border: isSelected ? '2px solid #fff' : 'none', fontSize: '12px', fontWeight: '600', outline: isSelected ? '2px solid ' + bg : 'none', outlineOffset: '1px' } };
                  }}
                  formats={calendarFormats}
                />
              </div>
            )}
          </div>

          {/* Route detail panel — appears when an event is selected */}
          {selectedItem && (
            <div id="collector-detail-panel" className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-primary/30">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-outline text-xs font-bold uppercase">Chi tiết tuyến đã chọn</p>
                    <h3 className="text-2xl font-bold font-headline text-on-surface mt-1">{selectedItem.routeName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {badge && (
                      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider border ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                    <button type="button" onClick={() => setSelectedItem(null)}
                      className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm mb-5">
                  <div>
                    <p className="text-outline text-xs font-bold uppercase mb-1">Giờ bắt đầu</p>
                    <p className="font-bold text-on-surface">
                      {selectedItem.startTime || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-outline text-xs font-bold uppercase mb-1">Loại rác</p>
                    <p className="font-bold text-on-surface">{selectedItem.wasteType || 'Recycling'}</p>
                  </div>
                  <div>
                    <p className="text-outline text-xs font-bold uppercase mb-1">Phân công</p>
                    <p className="font-bold text-secondary">
                      {selectedItem.teamName
                        ? `Đội: ${selectedItem.teamName}`
                        : (selectedItem.teamId ? 'Đi theo Đội' : 'Đi 1 mình')}
                    </p>
                  </div>
                  <div>
                    <p className="text-outline text-xs font-bold uppercase mb-1">Khu vực</p>
                    <p className="font-bold text-on-surface">
                      {selectedItem.neighborhood
                        ? `${selectedItem.neighborhood}, ${selectedItem.ward}`
                        : (selectedItem.ward
                          ? selectedItem.ward
                          : (selectedItem.city || '—'))}
                    </p>
                  </div>
                </div>

                {/* Team members display */}
                {selectedItem.teamMembers && selectedItem.teamMembers.length > 0 && (
                  <div className="mb-5 p-4 bg-primary-container/10 rounded-xl border border-primary/20">
                    <p className="text-xs font-bold uppercase text-primary mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">group</span>
                      Thành viên đội {selectedItem.teamName || ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.teamMembers.map((member, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-primary/20 text-sm font-medium">
                          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                            {(member.name || 'C')[0].toUpperCase()}
                          </span>
                          {member.name || member.id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.notes && (
                  <div className="mb-5 p-3 bg-surface-container-low rounded-xl text-sm text-on-surface-variant">
                    <span className="font-semibold text-xs text-outline uppercase">Ghi chú: </span>{selectedItem.notes}
                  </div>
                )}

                {selectedItem.incident && (
                  <div className="mb-5 p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-800">
                    <p className="font-bold">Sự cố đã báo:</p>
                    <p className="mt-1">{selectedItem.incident.description}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4 border-t border-outline-variant">
                  {canStart(selectedItem.status) && (
                    <button type="button" disabled={actionLoading} onClick={() => handleAction('start')}
                      className="px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                      <span className="material-symbols-outlined text-lg">play_arrow</span>Bắt đầu thu gom
                    </button>
                  )}
                  {canComplete(selectedItem.status) && (
                    <button type="button" disabled={actionLoading} onClick={() => { setShowCompleteModal(true); setEvidenceFiles([]); setError(''); }}
                      className="px-5 py-2.5 bg-primary-container text-on-primary-container font-bold text-sm rounded-xl hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                      <span className="material-symbols-outlined text-lg">check_circle</span>Hoàn thành
                    </button>
                  )}
                  {!['completed', 'completed_pending_approval', 'delayed'].includes((selectedItem.status || '').toLowerCase()) && (
                    <button type="button" disabled={actionLoading}
                      onClick={() => { setShowIncidentModal(true); setEvidenceFiles([]); setIncidentForm({ incidentType: 'vehicle_breakdown', description: '' }); setError(''); }}
                      className="px-5 py-2.5 bg-error-container/40 text-error font-bold text-sm rounded-xl hover:bg-error-container/60 flex items-center gap-2 disabled:opacity-50">
                      <span className="material-symbols-outlined text-lg">report</span>Báo sự cố
                    </button>
                  )}
                </div>
              </div>

              {/* Map */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-outline-variant">
                <div className="px-6 py-4 border-b border-outline-variant">
                  <h4 className="text-lg font-bold">{selectedItem.routeName}</h4>
                  <p className="text-on-surface-variant text-sm">Nhân viên: {user.fullName}</p>
                </div>
                <div className="p-3">
                  <CollectionRouteMap
                    title={selectedItem.routeName}
                    collectorName={user.fullName}
                    routePoints={selectedItem.routePoints?.length ? selectedItem.routePoints : undefined}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications + Feedback row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notification Center */}
            <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">notifications</span>
                  Trung tâm thông báo
                </h3>
                <button type="button" onClick={() => navigate('/thong-bao')} className="text-primary text-xs font-bold hover:underline">Xem tất cả</button>
              </div>
              <div className="divide-y divide-outline-variant">
                {recentNotifications.length > 0 ? recentNotifications.slice(0, 3).map((notif) => (
                  <div key={notif.id} onClick={() => navigate('/thong-bao')} className="p-4 hover:bg-surface-container transition-colors cursor-pointer">
                    <div className="flex gap-3 items-start">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.is_read ? 'font-bold text-on-surface' : 'font-medium text-on-surface-variant'}`}>{notif.title || notif.content}</p>
                        {notif.title && <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{notif.content}</p>}
                        <p className="text-[10px] text-outline mt-1 font-bold">{timeAgo(notif.sent_at)}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl opacity-30">notifications_off</span>
                    <p className="mt-1 text-xs">Chưa có thông báo mới nào.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resident Feedback */}
            <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-base">feedback</span>
                  Phản ánh mới cần xử lý
                </h3>
                <Link to="/collector/reports" className="text-primary text-xs font-bold hover:underline">Xem tất cả</Link>
              </div>
              <div className="p-4 space-y-3">
                {assignedReports.length > 0 ? assignedReports.slice(0, 2).map((rep) => (
                  <div key={rep.id} onClick={() => navigate('/collector/reports')}
                    className="flex items-start gap-3 p-3 border border-outline-variant rounded-lg hover:border-primary transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-error-container/20 flex items-center justify-center text-error flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">report</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface text-sm truncate">{rep.title || rep.category}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{rep.description}</p>
                      <p className="text-[10px] text-outline mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-xs">location_on</span>{rep.ward || '—'}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl opacity-30">assignment_turned_in</span>
                    <p className="mt-2 text-xs">Chưa có phản ánh nào được giao.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team & Salary Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Team Section */}
            <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-primary-container/5 flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">group</span>
                  Đội của tôi
                </h3>
              </div>
              <div className="p-4">
                {myTeams.length > 0 ? myTeams.map((team) => (
                  <div key={team.id} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm">
                        <span className="material-symbols-outlined">groups</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{team.teamName}</p>
                        <p className="text-xs text-on-surface-variant">{team.members.length} thành viên</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {team.members.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 bg-surface-container-low rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center">
                            {(member.name || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{member.name || member.id}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl opacity-30">group_off</span>
                    <p className="mt-2 text-xs">Bạn chưa được phân vào đội nào.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Salary Section */}
            <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-emerald-50/50 flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-base">payments</span>
                  Lương & Thưởng
                </h3>
                <span className="text-xs text-on-surface-variant font-medium">
                  Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
                </span>
              </div>
              <div className="p-4">
                {currentSalary ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-surface-container-low rounded-xl text-center">
                        <p className="text-xs text-outline font-bold uppercase mb-1">Lương cơ bản</p>
                        <p className="text-lg font-bold text-on-surface">{(currentSalary.baseSalary || 0).toLocaleString('vi-VN')}đ</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-200">
                        <p className="text-xs text-emerald-700 font-bold uppercase mb-1">Thưởng</p>
                        <p className="text-lg font-bold text-emerald-600">+{(currentSalary.bonus || 0).toLocaleString('vi-VN')}đ</p>
                      </div>
                      <div className="p-3 bg-primary-container/20 rounded-xl text-center border border-primary/20">
                        <p className="text-xs text-primary font-bold uppercase mb-1">Tổng</p>
                        <p className="text-lg font-bold text-primary">{(currentSalary.totalSalary || 0).toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>
                    {currentSalary.bonusReason && (
                      <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800 border border-emerald-100">
                        <span className="font-semibold">Lý do thưởng: </span>{currentSalary.bonusReason}
                      </div>
                    )}
                    {/* Salary History */}
                    {salaryHistory.length > 1 && (
                      <div>
                        <p className="text-xs font-bold text-outline uppercase mb-2">Lịch sử lương</p>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {salaryHistory.slice(0, 6).map((record) => (
                            <div key={record.id} className="flex justify-between items-center px-3 py-2 bg-surface-container-lowest rounded-lg text-sm">
                              <span className="text-on-surface-variant font-medium">T{record.month}/{record.year}</span>
                              <span className="font-bold text-on-surface">{(record.totalSalary || 0).toLocaleString('vi-VN')}đ</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl opacity-30">money_off</span>
                    <p className="mt-2 text-xs">Chưa có thông tin lương tháng này.</p>
                    <p className="text-[10px] text-outline mt-1">Liên hệ Manager để cập nhật.</p>
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
                <button type="button" onClick={() => setShowCompleteModal(false)} className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-bold">Hủy</button>
                <button type="button" disabled={actionLoading} onClick={handleCompleteSubmit} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50">Xác nhận hoàn thành</button>
              </div>
            </div>
          </div>
        )}

        {showIncidentModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl relative">
              <h3 className="text-lg font-bold text-on-surface font-headline">Báo sự cố</h3>
              <p className="text-sm text-on-surface-variant mt-2">Mô tả sự cố từ 20–1000 ký tự. Lịch sẽ chuyển sang trạng thái bị hoãn.</p>
              <select value={incidentForm.incidentType} onChange={(e) => setIncidentForm((prev) => ({ ...prev, incidentType: e.target.value }))} className="mt-4 w-full rounded-lg border border-outline-variant px-3 py-2 text-sm">
                {INCIDENT_TYPES.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              <textarea value={incidentForm.description} onChange={(e) => setIncidentForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} placeholder="Mô tả chi tiết sự cố..." className="mt-3 w-full rounded-lg border border-outline-variant px-3 py-2 text-sm" />
              <p className="text-xs text-outline mt-1">{incidentForm.description.length}/1000 ký tự</p>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))} className="mt-3 w-full text-sm border border-outline-variant rounded-lg p-2" />
              <div className="mt-6 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowIncidentModal(false)} className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-bold">Hủy</button>
                <button type="button" disabled={actionLoading} onClick={handleIncidentSubmit} className="px-4 py-2 rounded-lg bg-error text-white text-sm font-bold disabled:opacity-50">Gửi báo cáo</button>
              </div>
            </div>
          </div>
        )}

        {/* Deny Week Modal */}
        {showDenyModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDenyModal(false)}>
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Từ chối lịch tuần</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Tuần: <strong>{denyWeekLabel}</strong>. Tất cả lịch chưa hoàn thành trong tuần này sẽ bị đánh dấu từ chối và Manager sẽ được thông báo.
              </p>
              <textarea
                rows={3}
                placeholder="Lý do từ chối (bắt buộc)..."
                value={denyReason}
                onChange={e => setDenyReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowDenyModal(false)} className="px-5 py-2.5 rounded-xl border text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50">Hủy</button>
                <button disabled={denyLoading || !denyReason.trim()} onClick={handleDenyWeek}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold disabled:opacity-60">
                  {denyLoading ? 'Đang gửi...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CollectorLayout>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import collectorService from '../../services/collectorService';
import { ROLES, normalizeRole } from '../../constants/roles';
import CollectionRouteMap from '../../components/CollectionRouteMap';
import CollectorTabs from '../../components/CollectorTabs';
import { filesToEvidenceUrls } from '../../utils/imageUtils';

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
  if (s === 'in_progress') return { label: 'Đang thu gom', className: 'bg-sky-100 text-sky-700' };
  if (s === 'completed_pending_approval') return { label: 'Chờ Manager xác nhận', className: 'bg-amber-100 text-amber-800' };
  if (s === 'completed') return { label: 'Đã xác nhận', className: 'bg-emerald-100 text-emerald-700' };
  if (s === 'delayed') return { label: 'Bị hoãn', className: 'bg-amber-100 text-amber-800' };
  return { label: 'Chờ thực hiện', className: 'bg-slate-100 text-slate-700' };
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
      return;
    }
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardData, scheduleData] = await Promise.all([
        collectorService.getDashboard(todayISO()),
        collectorService.getAllSchedules(),
      ]);
      setSummary(dashboardData);
      const items = scheduleData.items || [];
      setSchedules(items);
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
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const badge = selectedItem ? getStatusBadge(selectedItem.status) : null;
  const modalOpen = showCompleteModal || showIncidentModal;

  return (
    <>
      <CollectorTabs />
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900 py-10 px-4 md:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">{user.fullName}</h1>
                <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Collector</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                !dateFilter
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
              }`}
            >
              Tất cả lịch
            </button>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm"
              title="Lọc theo ngày"
            />
            <button
              type="button"
              onClick={handleLogout}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-sm font-semibold rounded-xl flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Đăng xuất
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        )}
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>
        )}

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Lịch hôm nay</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{summary.todayAssignments}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Đang thực hiện</p>
              <p className="text-3xl font-bold text-sky-600 mt-2">{summary.inProgressAssignments}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Chờ xác nhận</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{summary.pendingApprovalAssignments ?? 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">Đã hoàn thành</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{summary.completedAssignments}</p>
            </div>
            <Link
              to="/collector/reports"
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:border-emerald-400 transition-colors block"
            >
              <p className="text-xs uppercase tracking-widest text-slate-500">Phản ánh chờ xử lý</p>
              <p className="text-3xl font-bold text-violet-600 mt-2">{summary.pendingReports ?? 0}</p>
              <p className="text-xs text-emerald-600 mt-2 font-semibold">Xem phản ánh →</p>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Lịch làm việc</p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              {dateFilter ? formatDateLabel(dateFilter) : 'Tất cả lịch được gán'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {filteredSchedules.length} tuyến{dateFilter ? '' : ` / ${schedules.length} tổng`}
            </p>

            {loading ? (
              <p className="text-sm text-slate-500">Đang tải...</p>
            ) : filteredSchedules.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <span className="material-symbols-outlined text-4xl opacity-30">event_busy</span>
                <p className="mt-3 text-sm">
                  {dateFilter ? 'Không có lịch thu gom trong ngày này.' : 'Chưa có lịch thu gom được gán.'}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {groupedSchedules.map(([groupDate, items]) => (
                  <div key={groupDate}>
                    {!dateFilter && (
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 sticky top-0 bg-white dark:bg-slate-800 py-1">
                        {formatDateLabel(groupDate)}
                      </p>
                    )}
                    <div className="space-y-3">
                      {items.map((item) => {
                        const itemBadge = getStatusBadge(item.status);
                        const isSelected = selectedItem?.id === item.id && selectedItem?.sourceType === item.sourceType;
                        return (
                          <button
                            key={`${item.sourceType}-${item.id}`}
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                              isSelected
                                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.routeName}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${itemBadge.className}`}>
                                {itemBadge.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              {item.startTime && item.endTime ? `${item.startTime} – ${item.endTime}` : 'Giờ chưa xác định'}
                            </p>
                            {item.ward && (
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">location_on</span>
                                {item.neighborhood ? `${item.neighborhood}, ${item.ward}` : item.ward}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-2 space-y-6">
            {selectedItem ? (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">Chi tiết tuyến</p>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedItem.routeName}</h2>
                    </div>
                    {badge && (
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">Giờ dự kiến</p>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {selectedItem.startTime && selectedItem.endTime
                          ? `${selectedItem.startTime} – ${selectedItem.endTime}`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Loại rác</p>
                      <p className="font-semibold text-slate-800 dark:text-white">{selectedItem.wasteType || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Phân công</p>
                      <p className="font-semibold text-sky-600 dark:text-sky-400">
                        {selectedItem.teamId 
                          ? 'Đi theo Đội' 
                          : 'Đi 1 mình'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Xe / phương tiện</p>
                      <p className="font-semibold text-slate-800 dark:text-white">{selectedItem.vehicleCode || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Khu vực</p>
                      <p className="font-semibold text-slate-800 dark:text-white">{selectedItem.ward || '—'}</p>
                    </div>
                  </div>

                  {selectedItem.notes && (
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                      {selectedItem.notes}
                    </p>
                  )}

                  {selectedItem.incident && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <p className="font-semibold">Sự cố đã báo</p>
                      <p className="mt-1">{selectedItem.incident.description}</p>
                    </div>
                  )}

                  {(selectedItem.status || '').toLowerCase() === 'completed_pending_approval' && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <p className="font-semibold">Đã gửi hoàn thành</p>
                      <p className="mt-1">Tuyến đang chờ Manager xác nhận kết quả thu gom.</p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    {canStart(selectedItem.status) && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleAction('start')}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
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
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
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
                          setShowIncidentModal(true);
                          setEvidenceFiles([]);
                          setIncidentForm({ incidentType: 'vehicle_breakdown', description: '' });
                          setError('');
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">report</span>
                        Báo sự cố
                      </button>
                    )}
                  </div>
                </div>

                {!modalOpen && (
                <CollectionRouteMap
                  title={selectedItem.routeName}
                  collectorName={user.fullName}
                  routePoints={selectedItem.routePoints?.length ? selectedItem.routePoints : undefined}
                  readOnly
                />
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-10 text-center text-slate-500">
                <span className="material-symbols-outlined text-5xl opacity-30">map</span>
                <p className="mt-3">Chọn một tuyến để xem chi tiết và cập nhật tiến độ.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCompleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Xác nhận hoàn thành</h3>
            <p className="text-sm text-slate-500 mt-2">Upload ít nhất 1 ảnh minh chứng sau khi thu gom.</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
              className="mt-4 w-full text-sm"
            />
            {evidenceFiles.length > 0 && (
              <p className="text-xs text-emerald-600 mt-2">Đã chọn {evidenceFiles.length} ảnh.</p>
            )}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 rounded-xl border text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCompleteSubmit}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                Xác nhận hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}

      {showIncidentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Báo sự cố</h3>
            <p className="text-sm text-slate-500 mt-2">Mô tả sự cố từ 20–1000 ký tự. Lịch sẽ chuyển sang trạng thái bị hoãn.</p>
            <select
              value={incidentForm.incidentType}
              onChange={(e) => setIncidentForm((prev) => ({ ...prev, incidentType: e.target.value }))}
              className="mt-4 w-full rounded-xl border px-3 py-2 text-sm"
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
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">{incidentForm.description.length}/1000 ký tự</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
              className="mt-3 w-full text-sm"
            />
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowIncidentModal(false)}
                className="px-4 py-2 rounded-xl border text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleIncidentSubmit}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

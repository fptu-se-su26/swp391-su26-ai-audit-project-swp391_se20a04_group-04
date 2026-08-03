import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import collectorService from '../../services/collectorService';
import { ROLES, normalizeRole } from '../../constants/roles';
import CollectorLayout from '../../components/CollectorLayout';

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function CollectorAttendance() {
  const navigate = useNavigate();
  const [user] = useState(() => authService.getCurrentUser());
  const [attendance, setAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    try {
      const [todayAtt, histData] = await Promise.all([
        collectorService.getTodayAttendance().catch(() => null),
        collectorService.getAttendanceHistory().catch(() => []),
      ]);
      setAttendance(todayAtt);
      setHistory(Array.isArray(histData) ? histData : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu điểm danh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await collectorService.checkIn();
      setMessage(res.message || 'Điểm danh vào ca thành công!');
      await loadData();
    } catch (err) {
      setError(err.message || 'Không thể điểm danh vào ca.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await collectorService.checkOut();
      setMessage(res.message || 'Điểm danh ra ca thành công!');
      await loadData();
    } catch (err) {
      setError(err.message || 'Không thể điểm danh ra ca.');
    } finally {
      setActionLoading(false);
    }
  };

  const completedDaysCount = history.filter(h => h.status === 'completed' || h.status === 'in_shift').length;
  const totalHoursCount = history.reduce((sum, h) => sum + (Number(h.work_hours) || 0), 0);

  return (
    <CollectorLayout user={user}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-emerald-600 text-2xl">timer</span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Chấm công & Ca làm việc</h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý ca làm việc và theo dõi nhật ký điểm danh hàng ngày
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Làm mới
          </button>
        </div>

        {/* Message Notifications */}
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 p-4 text-sm font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Thẻ Điểm danh Ca làm chính (Current Shift Card) */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-sky-100 dark:border-sky-900/50 shadow-md p-6 relative overflow-hidden bg-gradient-to-r from-sky-50/70 via-white to-sky-50/20 dark:from-sky-950/30 dark:via-slate-800 dark:to-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-md shrink-0 ${
                attendance?.status === 'in_shift'
                  ? 'bg-emerald-500 text-white animate-pulse'
                  : attendance?.status === 'completed'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                <span className="material-symbols-outlined text-4xl">how_to_reg</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ca làm việc hôm nay</h2>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-extrabold ${
                    attendance?.status === 'in_shift'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 animate-pulse'
                      : attendance?.status === 'completed'
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
                  }`}>
                    {attendance?.status === 'in_shift' ? '🟢 ĐANG TRONG CA LÀM' :
                     attendance?.status === 'completed' ? '🔵 ĐÃ HOÀN THÀNH CA' :
                     '⚪ CHƯA VÀO CA'}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {attendance?.status === 'in_shift' && (
                    <>Vào ca lúc: <span className="font-bold text-emerald-600 dark:text-emerald-400">{new Date(attendance.check_in).toLocaleTimeString('vi-VN')}</span></>
                  )}
                  {attendance?.status === 'completed' && (
                    <>
                      Vào ca: <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(attendance.check_in).toLocaleTimeString('vi-VN')}</span>
                      {' · '}
                      Ra ca: <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(attendance.check_out).toLocaleTimeString('vi-VN')}</span>
                      {' '}
                      (<span className="font-bold text-sky-600 dark:text-sky-400">{attendance.work_hours} giờ</span>)
                    </>
                  )}
                  {(!attendance || attendance?.status === 'not_checked_in') && (
                    <>Bấm nút Check-in để bắt đầu ghi nhận thời gian làm việc hôm nay.</>
                  )}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              {(!attendance || attendance?.status === 'not_checked_in') && (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-xl">login</span>
                  )}
                  BẮT ĐẦU CA (CHECK-IN)
                </button>
              )}

              {attendance?.status === 'in_shift' && (
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base shadow-lg hover:shadow-rose-600/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-xl">logout</span>
                  )}
                  KẾT THÚC CA (CHECK-OUT)
                </button>
              )}

              {attendance?.status === 'completed' && (
                <div className="px-5 py-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold text-sm flex items-center gap-2 border border-sky-200 dark:border-sky-800">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  Ca làm đã được ghi nhận
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Summary Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0">
              <span className="material-symbols-outlined">event_available</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số ngày công tháng này</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{completedDaysCount} ngày</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xl shrink-0">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng giờ làm tích lũy</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{totalHoursCount.toFixed(1)} giờ</p>
            </div>
          </div>
        </div>

        {/* Nhật ký điểm danh tháng này (Attendance History Table) */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-sky-600">history</span>
              Nhật ký điểm danh tháng này
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{history.length} bản ghi</span>
          </div>

          {loading ? (
            <p className="text-center py-8 text-sm text-slate-400">Đang tải nhật ký điểm danh...</p>
          ) : history.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-400">Chưa có nhật ký điểm danh nào trong tháng này.</p>
          ) : (
            <div className="space-y-3">
              {history.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      rec.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                    }`}>
                      <span className="material-symbols-outlined text-lg">event</span>
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {formatDateLabel(rec.date)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Vào ca: <span className="font-semibold text-slate-700 dark:text-slate-300">{rec.check_in ? new Date(rec.check_in).toLocaleTimeString('vi-VN') : '--:--'}</span>
                        {rec.check_out && (
                          <> · Ra ca: <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(rec.check_out).toLocaleTimeString('vi-VN')}</span></>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      rec.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                    }`}>
                      {rec.status === 'completed' ? 'Đã hoàn thành' : 'Đang làm'}
                    </span>
                    <p className="font-bold text-sky-600 dark:text-sky-400 text-sm">
                      {rec.work_hours || 0} giờ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </CollectorLayout>
  );
}

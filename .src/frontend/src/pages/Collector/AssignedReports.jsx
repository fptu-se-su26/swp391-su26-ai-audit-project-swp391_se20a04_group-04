import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import collectorService from '../../services/collectorService';
import { ROLES, normalizeRole } from '../../constants/roles';
import CollectorTabs from '../../components/CollectorTabs';
import { filesToEvidenceUrls } from '../../utils/imageUtils';

const CATEGORY_LABELS = {
  garbage_overflow: 'Rác tồn đọng',
  illegal_dumping: 'Đổ rác trái phép',
  bad_smell: 'Mùi hôi',
};

const SEVERITY_LABELS = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

function getReportStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'in_progress') return { label: 'Đang xử lý', className: 'bg-sky-100 text-sky-700' };
  if (s === 'resolved_pending_approval') return { label: 'Chờ Manager duyệt', className: 'bg-amber-100 text-amber-800' };
  if (s === 'resolved' || s === 'closed') return { label: 'Đã đóng', className: 'bg-emerald-100 text-emerald-700' };
  if (s === 'assigned') return { label: 'Đã giao việc', className: 'bg-violet-100 text-violet-700' };
  return { label: 'Chờ xử lý', className: 'bg-slate-100 text-slate-700' };
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN');
}

export default function AssignedReports() {
  const navigate = useNavigate();
  const [user] = useState(() => authService.getCurrentUser());
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveMessage, setResolveMessage] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (normalizeRole(user.role) !== ROLES.COLLECTOR) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await collectorService.getAssignedReports();
      setReports(data);
      setSelectedReport((prev) => {
        if (!prev) return data[0] || null;
        return data.find((r) => r.id === prev.id) || data[0] || null;
      });
    } catch (err) {
      setError(err.message || 'Không thể tải phản ánh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadReports();
    }
  }, [user, loadReports]);

  useEffect(() => {
    if (!selectedReport) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setComments([]);
      return;
    }
    collectorService.getReportComments(selectedReport.id)
      .then(setComments)
      .catch(() => {
        setComments([]);
      });
  }, [selectedReport]);

  const filteredReports = reports.filter((r) => {
    const s = (r.status || '').toLowerCase();
    if (filter === 'pending') return ['assigned', 'submitted', 'verified', 'in_progress'].includes(s);
    if (filter === 'awaiting') return ['resolved_pending_approval', 'resolved'].includes(s);
    if (filter === 'closed') return ['closed', 'rejected', 'cancelled'].includes(s);
    return true;
  });

  const handleStart = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      await collectorService.updateReportStatus(selectedReport.id, {
        status: 'in_progress',
        message: 'Đã đến hiện trường, đang xử lý.',
      });
      setMessage('Đã bắt đầu xử lý phản ánh.');
      await loadReports();
      const updatedComments = await collectorService.getReportComments(selectedReport.id);
      setComments(updatedComments);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async () => {
    if (!selectedReport) return;
    if (evidenceFiles.length === 0) {
      setError('Vui lòng chọn ít nhất 1 ảnh đối chứng.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const imageUrls = await filesToEvidenceUrls(evidenceFiles);
      await collectorService.updateReportStatus(selectedReport.id, {
        status: 'resolved_pending_approval',
        message: resolveMessage.trim(),
        imageUrls,
      });
      setMessage('Đã gửi kết quả xử lý. Chờ Manager duyệt trước khi đóng phản ánh.');
      setShowResolveModal(false);
      setResolveMessage('');
      setEvidenceFiles([]);
      await loadReports();
      const updatedComments = await collectorService.getReportComments(selectedReport.id);
      setComments(updatedComments);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const badge = selectedReport ? getReportStatusBadge(selectedReport.status) : null;
  const canStart = selectedReport && ['assigned', 'submitted', 'verified'].includes((selectedReport.status || '').toLowerCase());
  const canResolve = selectedReport && (selectedReport.status || '').toLowerCase() === 'in_progress';

  return (
    <>
      <CollectorTabs />
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900 py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Phản ánh được giao</h1>
            <p className="text-sm text-slate-500 mt-1">Xử lý các phản ánh môi trường Manager đã phân công cho bạn.</p>
          </div>
          <div className="flex gap-2">
            {['pending', 'awaiting', 'closed', 'all'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                  filter === key ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {key === 'pending' ? 'Đang xử lý' : key === 'awaiting' ? 'Chờ duyệt' : key === 'closed' ? 'Đã đóng' : 'Tất cả'}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
              Danh sách ({filteredReports.length})
            </h2>
            {loading ? (
              <p className="text-sm text-slate-500">Đang tải...</p>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <span className="material-symbols-outlined text-4xl opacity-30">inbox</span>
                <p className="mt-3 text-sm">Không có phản ánh nào.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => {
                  const itemBadge = getReportStatusBadge(report.status);
                  const isSelected = selectedReport?.id === report.id;
                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => { setSelectedReport(report); setError(''); setMessage(''); }}
                      className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                        isSelected ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex justify-between gap-2">
                        <p className="font-semibold text-sm text-slate-900">{report.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${itemBadge.className}`}>
                          {itemBadge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{report.description}</p>
                      <p className="text-xs text-slate-400 mt-2">{report.ward}{report.neighborhood ? ` · ${report.neighborhood}` : ''}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="xl:col-span-2 space-y-6">
            {selectedReport ? (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">Chi tiết phản ánh</p>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedReport.title}</h2>
                    </div>
                    {badge && (
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold h-fit ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{selectedReport.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-slate-500 text-xs">Loại</p>
                      <p className="font-semibold">{CATEGORY_LABELS[selectedReport.category] || selectedReport.category}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Mức độ</p>
                      <p className="font-semibold">{SEVERITY_LABELS[selectedReport.severity] || selectedReport.severity}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Khu vực</p>
                      <p className="font-semibold">{selectedReport.ward || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Cập nhật</p>
                      <p className="font-semibold">{formatDateTime(selectedReport.updatedAt)}</p>
                    </div>
                  </div>

                  {selectedReport.location?.address && (
                    <p className="text-sm text-slate-500 flex items-start gap-2 mb-4">
                      <span className="material-symbols-outlined text-base">location_on</span>
                      {selectedReport.location.address}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {canStart && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleStart}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-600 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">play_arrow</span>
                        Bắt đầu xử lý
                      </button>
                    )}
                    {canResolve && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => {
                          setShowResolveModal(true);
                          setResolveMessage('');
                          setEvidenceFiles([]);
                          setError('');
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        Hoàn thành xử lý
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Lịch sử xử lý</h3>
                  {comments.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có cập nhật nào.</p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((c) => (
                        <div key={c.id} className="border-l-2 border-emerald-400 pl-4">
                          <p className="text-sm text-slate-800 dark:text-slate-200">{c.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {c.role} · {formatDateTime(c.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border p-10 text-center text-slate-500">
                Chọn một phản ánh để xem chi tiết.
              </div>
            )}
          </div>
        </div>
      </div>

      {showResolveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold">Gửi kết quả xử lý</h3>
            <p className="text-sm text-slate-500 mt-2">Mô tả kết quả (≥10 ký tự), upload ảnh đối chứng. Manager sẽ duyệt trước khi đóng phản ánh.</p>
            <textarea
              value={resolveMessage}
              onChange={(e) => setResolveMessage(e.target.value)}
              rows={4}
              placeholder="Mô tả kết quả sau khi dọn dẹp..."
              className="mt-4 w-full rounded-xl border px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">{resolveMessage.length} ký tự (tối thiểu 10)</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
              className="mt-3 w-full text-sm"
            />
            {evidenceFiles.length > 0 && (
              <p className="text-xs text-emerald-600 mt-2">Đã chọn {evidenceFiles.length} ảnh.</p>
            )}
            <div className="mt-6 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowResolveModal(false)} className="px-4 py-2 rounded-xl border text-sm font-semibold">
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleResolveSubmit}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                Xác nhận gửi duyệt
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

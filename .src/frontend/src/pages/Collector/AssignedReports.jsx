import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import collectorService from '../../services/collectorService';
import { ROLES, normalizeRole } from '../../constants/roles';
import CollectorLayout from '../../components/CollectorLayout';
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
  if (s === 'in_progress') return { label: 'Đang xử lý', className: 'bg-sky-100 text-sky-800 border-sky-300' };
  if (s === 'resolved_pending_approval') return { label: 'Chờ Manager duyệt', className: 'bg-amber-100 text-amber-800 border-amber-300' };
  if (s === 'resolved' || s === 'closed') return { label: 'Đã đóng', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (s === 'assigned') return { label: 'Đã giao việc', className: 'bg-violet-100 text-violet-800 border-violet-300' };
  return { label: 'Chờ xử lý', className: 'bg-slate-100 text-slate-800 border-slate-300' };
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
      loadReports();
    }
  }, [user, loadReports]);

  useEffect(() => {
    if (!selectedReport) {
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
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)] bg-surface">
        <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
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
    <CollectorLayout user={user}>
      <div className="max-w-[1280px] mx-auto p-6 lg:p-12 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-headline text-on-surface">Phản ánh được giao</h1>
            <p className="text-sm text-on-surface-variant mt-1">Xử lý các phản ánh môi trường Manager đã phân công cho bạn.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['pending', 'awaiting', 'closed', 'all'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  filter === key
                    ? 'bg-primary text-white'
                    : 'bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {key === 'pending' ? 'Đang xử lý' : key === 'awaiting' ? 'Chờ duyệt' : key === 'closed' ? 'Đã đóng' : 'Tất cả'}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="rounded-xl border border-error-container bg-error-container/20 p-4 text-sm text-error font-medium">{error}</div>}
        {message && <div className="rounded-xl border border-primary-container bg-primary-container/20 p-4 text-sm text-primary font-medium">{message}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-outline-variant p-5">
            <h2 className="font-bold text-on-surface font-headline mb-4">
              Danh sách ({filteredReports.length})
            </h2>
            {loading ? (
              <p className="text-sm text-on-surface-variant">Đang tải...</p>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl opacity-40">inbox</span>
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
                      className={`w-full text-left rounded-xl border p-4 transition-colors ${
                        isSelected ? 'border-primary bg-primary-container/5' : 'border-outline-variant hover:border-primary/50'
                      }`}
                    >
                      <div className="flex justify-between gap-2">
                        <p className="font-bold text-sm text-on-surface">{report.title}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 uppercase border ${itemBadge.className}`}>
                          {itemBadge.label}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-2 line-clamp-2">{report.description}</p>
                      <p className="text-xs text-outline mt-2">{report.ward}{report.neighborhood ? ` · ${report.neighborhood}` : ''}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="xl:col-span-2 space-y-6">
            {selectedReport ? (
              <>
                <div className="bg-white rounded-xl border border-outline-variant p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-outline font-bold">Chi tiết phản ánh</p>
                      <h2 className="text-xl font-bold font-headline text-on-surface">{selectedReport.title}</h2>
                    </div>
                    {badge && (
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold shrink-0 uppercase border h-fit ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-on-surface-variant mb-4">{selectedReport.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-outline text-xs font-bold uppercase">Loại</p>
                      <p className="font-bold text-on-surface">{CATEGORY_LABELS[selectedReport.category] || selectedReport.category}</p>
                    </div>
                    <div>
                      <p className="text-outline text-xs font-bold uppercase">Mức độ</p>
                      <p className="font-bold text-on-surface">{SEVERITY_LABELS[selectedReport.severity] || selectedReport.severity}</p>
                    </div>
                    <div>
                      <p className="text-outline text-xs font-bold uppercase">Khu vực</p>
                      <p className="font-bold text-on-surface">{selectedReport.ward || '—'}</p>
                    </div>
                    <div>
                      <p className="text-outline text-xs font-bold uppercase">Cập nhật</p>
                      <p className="font-bold text-on-surface">{formatDateTime(selectedReport.updatedAt)}</p>
                    </div>
                  </div>

                  {selectedReport.location?.address && (
                    <p className="text-sm text-on-surface-variant flex items-start gap-2 mb-4">
                      <span className="material-symbols-outlined text-base text-primary">location_on</span>
                      {selectedReport.location.address}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {canStart && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleStart}
                        className="inline-flex items-center gap-2 rounded-lg bg-secondary text-white px-5 py-2.5 text-sm font-bold disabled:opacity-50"
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
                        className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        Hoàn thành xử lý
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-outline-variant p-6">
                  <h3 className="font-bold font-headline text-on-surface mb-4">Lịch sử xử lý</h3>
                  {comments.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">Chưa có cập nhật nào.</p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((c) => (
                        <div key={c.id} className="border-l-2 border-primary pl-4">
                          <p className="text-sm text-on-surface font-medium">{c.message}</p>
                          <p className="text-xs text-outline mt-1">
                            {c.role} · {formatDateTime(c.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-outline-variant p-10 text-center text-on-surface-variant">
                Chọn một phản ánh để xem chi tiết.
              </div>
            )}
          </div>
        </div>

        {showResolveModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold font-headline text-on-surface">Gửi kết quả xử lý</h3>
              <p className="text-sm text-on-surface-variant mt-2">
                Mô tả kết quả (≥10 ký tự), upload ảnh đối chứng. Manager sẽ duyệt trước khi đóng phản ánh.
              </p>
              <textarea
                value={resolveMessage}
                onChange={(e) => setResolveMessage(e.target.value)}
                rows={4}
                placeholder="Mô tả kết quả sau khi dọn dẹp..."
                className="mt-4 w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
              />
              <p className="text-xs text-outline mt-1">{resolveMessage.length} ký tự (tối thiểu 10)</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
                className="mt-3 w-full text-sm border border-outline-variant rounded-lg p-2"
              />
              {evidenceFiles.length > 0 && (
                <p className="text-xs text-primary mt-2 font-semibold">Đã chọn {evidenceFiles.length} ảnh.</p>
              )}
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleResolveSubmit}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50"
                >
                  Xác nhận gửi duyệt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CollectorLayout>
  );
}

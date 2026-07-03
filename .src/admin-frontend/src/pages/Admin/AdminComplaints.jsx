import { useState, useEffect } from 'react';
import complaintService from '../../services/complaintService';

export default function AdminComplaints({ hideHeader = false }) {
  const [allComplaints, setAllComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // UI State
  const [expandedComplaintId, setExpandedComplaintId] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complaintService.getAdminComplaints('', '', '', '');
      setAllComplaints(res.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách phản ánh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComplaints();
  }, []);

  const filteredComplaints = allComplaints.filter(c => {
    if (roleFilter && c.userRole !== roleFilter) return false;
    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase();
      return (c.title && c.title.toLowerCase().includes(lowerSearch)) || 
             (c.description && c.description.toLowerCase().includes(lowerSearch)) ||
             (c.userName && c.userName.toLowerCase().includes(lowerSearch));
    }
    return true;
  });

  const total = filteredComplaints.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const complaints = filteredComplaints.slice(start, start + limit);

  const getStatusBadge = (status) => {
    const s = status ? status.toLowerCase() : 'open';
    if (s === 'open') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/30">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Đang chờ xử lý
        </span>
      );
    }
    if (s === 'in progress' || s === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          Đang xử lý
        </span>
      );
    }
    if (s === 'resolved' || s === 'completed' || s === 'đã giải quyết') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Đã giải quyết
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
        {status}
      </span>
    );
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset trang khi tìm kiếm
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1); // Reset trang khi lọc
  };

  return (
    <div className={hideHeader ? "" : "min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 py-10 px-4 md:px-8"}>
      <div className={hideHeader ? "space-y-6" : "max-w-6xl mx-auto"}>
        {!hideHeader && (
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-200/50 dark:border-emerald-900/30">
              <span className="material-symbols-outlined text-sm font-semibold">admin_panel_settings</span>
              Quản trị viên
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Tổng hợp Phản ánh
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              Quản lý và theo dõi các phản ánh, ý kiến đóng góp từ người dùng trên toàn hệ thống.
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          {/* Thanh công cụ Tìm kiếm và Lọc */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm tiêu đề, nội dung, người gửi..."
                value={search}
                onChange={handleSearchChange}
                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all text-sm"
              />
            </div>
            <div className="w-full md:w-64 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                filter_list
              </span>
              <select
                value={roleFilter}
                onChange={handleRoleFilterChange}
                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 appearance-none text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all text-sm"
              >
                <option value="">Tất cả vai trò</option>
                <option value="RESIDENT">Cư dân (Resident)</option>
                <option value="MANAGER">Quản lý (Manager)</option>
                <option value="COLLECTOR">Nhân viên (Collector)</option>
                <option value="ADMIN">Quản trị viên (Admin)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">list_alt</span>
              Danh sách phản ánh
            </h2>
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
              {total} phản ánh
            </span>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl flex gap-3 text-rose-700 dark:text-rose-400 text-sm mb-6">
              <span className="material-symbols-outlined text-xl flex-shrink-0">error</span>
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 space-y-4">
              <span className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
              <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải dữ liệu...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="flex flex-col justify-center items-center text-center p-10 space-y-4">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/40 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800/60">
                <span className="material-symbols-outlined text-4xl">inbox</span>
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-white">Không tìm thấy phản ánh nào</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => {
                const isExpanded = expandedComplaintId === complaint.id;
                return (
                  <div 
                    key={complaint.id}
                    className={`bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800 overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'ring-2 ring-emerald-500/30' : 'hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div 
                      onClick={() => setExpandedComplaintId(isExpanded ? null : complaint.id)}
                      className="p-5 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none"
                    >
                      <div className="space-y-2 min-w-0 flex-grow">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
                            {complaint.type}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                            {formatDate(complaint.created_at)}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-850 dark:text-white truncate pr-4">
                          {complaint.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">person</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{complaint.userName || 'Ẩn danh'}</span>
                            <span className="opacity-70 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] ml-1">{complaint.userRole}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {complaint.neighborhood ? `${complaint.neighborhood}, ` : ''}{complaint.ward}, {complaint.city}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 justify-between lg:justify-end shrink-0">
                        {getStatusBadge(complaint.status)}
                        <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          keyboard_arrow_down
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-200/60 dark:border-slate-800/80 pt-4 bg-white/50 dark:bg-slate-900/40 space-y-4 animate-slide-down">
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung phản ánh:</h4>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {complaint.description}
                          </p>
                        </div>

                        {/* Hình ảnh minh chứng (nếu có) */}
                        {complaint.imageUrl && (
                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hình ảnh minh chứng:</h4>
                            <div className="max-w-md overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/30">
                              <img 
                                src={complaint.imageUrl} 
                                alt="Hình ảnh minh chứng thực tế" 
                                className="w-full h-auto max-h-64 object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
                                onClick={() => window.open(complaint.imageUrl, '_blank')}
                              />
                            </div>
                          </div>
                        )}

                        {complaint.reply && (
                          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-2 mt-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-350 uppercase">
                              <span className="material-symbols-outlined text-base">forum</span>
                              <span>Phản hồi từ Ban quản lý</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap pl-1">
                              {complaint.reply}
                            </p>
                            {complaint.replied_at && (
                              <div className="text-[10px] text-slate-400 text-right">
                                Thời gian phản hồi: {formatDate(complaint.replied_at)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Phân trang */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Trước
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Trang <span className="font-bold text-slate-800 dark:text-white">{page}</span> / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                Tiếp
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

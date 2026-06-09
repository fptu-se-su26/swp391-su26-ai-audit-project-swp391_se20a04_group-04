import { useState, useEffect } from 'react';
import authService from '../services/authService';
import complaintService from '../services/complaintService';

// Xác định base API URL động từ config authService
const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/auth', '') 
  : 'http://localhost:5000/api';

export default function Complaints() {
  const [user, setUser] = useState(authService.getCurrentUser());

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Rác chưa dọn');
  const [description, setDescription] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  // Dropdown options
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  // UI State
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [complaints, setComplaints] = useState([]);
  
  // Trạng thái mở rộng xem chi tiết phản ánh trong danh sách
  const [expandedComplaintId, setExpandedComplaintId] = useState(null);

  // 1. Tải danh sách tỉnh thành và lịch sử phản ánh khi mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch(`${API_BASE}/address/provinces`);
        if (!res.ok) throw new Error('Không thể tải danh sách Tỉnh/Thành');
        const data = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error('Lỗi tải tỉnh thành:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
    fetchComplaintsHistory();

    // Prefill tổ dân cư từ tài khoản
    if (user && user.neighborhood) {
      setNeighborhood(user.neighborhood);
    }
  }, [user]);

  // 2. Tải danh sách phường xã khi đổi tỉnh thành
  useEffect(() => {
    if (!selectedProvince) {
      setWards([]);
      setSelectedWard('');
      return;
    }

    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const res = await fetch(`${API_BASE}/address/wards?provinceCode=${selectedProvince}`);
        if (!res.ok) throw new Error('Không thể tải danh sách Phường/Xã');
        const data = await res.json();
        setWards(data);
        setSelectedWard('');
      } catch (err) {
        console.error('Lỗi tải phường xã:', err);
      } finally {
        setLoadingWards(false);
      }
    };

    fetchWards();
  }, [selectedProvince]);

  // Lấy lịch sử phản ánh của cư dân
  const fetchComplaintsHistory = async () => {
    if (!authService.isAuthenticated()) return;
    setLoadingHistory(true);
    try {
      const data = await complaintService.getComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Lỗi lấy lịch sử phản ánh:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Gửi biểu mẫu phản ánh
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!title.trim() || !description.trim() || !type) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (!selectedProvince || !selectedWard) {
      setError('Vui lòng chọn địa chỉ khu vực xảy ra sự cố.');
      return;
    }

    setSubmitting(true);

    try {
      const provinceObj = provinces.find(p => p.code.toString() === selectedProvince.toString());
      const wardObj = wards.find(w => w.code.toString() === selectedWard.toString());

      const payload = {
        title: title.trim(),
        type,
        description: description.trim(),
        city: provinceObj ? provinceObj.name : '',
        ward: wardObj ? wardObj.name : '',
        neighborhood: neighborhood.trim()
      };

      await complaintService.createComplaint(payload);

      setSuccessMsg('Gửi phản ánh thành công! Ý kiến của bạn đã được chuyển đến hệ thống của Ban quản lý.');
      
      // Reset form
      setTitle('');
      setDescription('');
      
      // Refresh history list
      fetchComplaintsHistory();
    } catch (err) {
      console.error('Lỗi gửi phản ánh:', err);
      setError(err.message || 'Đã xảy ra lỗi trong quá trình gửi phản ánh. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper render badge trạng thái phản ánh
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

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-200/50 dark:border-emerald-900/30">
            <span className="material-symbols-outlined text-sm font-semibold">rate_review</span>
            Phản Hồi & Đóng Góp Ý Kiến
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Gửi phản ánh cư dân
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm md:text-base">
            Nếu bạn gặp sự cố thu gom rác hoặc có đề xuất cải tiến môi trường khu phố, vui lòng gửi phản ánh dưới đây.
          </p>
        </div>

        {/* Kiểm tra đăng nhập */}
        {!authService.isAuthenticated() ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Yêu cầu đăng nhập</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Bạn cần đăng nhập bằng tài khoản Cư dân để thực hiện tính năng gửi phản ánh và xem lịch sử phản hồi.
            </p>
            <a 
              href="/login" 
              className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-100 shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              Đăng nhập ngay
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Form Gửi Phản Ánh - 2 cột trên grid 5 */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-6 sticky top-24 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">
                    edit_note
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Tạo phản ánh mới
                  </h2>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl flex gap-3 text-rose-700 dark:text-rose-400 text-sm animate-fade-in">
                    <span className="material-symbols-outlined text-xl flex-shrink-0">error</span>
                    <p>{error}</p>
                  </div>
                )}

                {successMsg && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl flex gap-3 text-emerald-700 dark:text-emerald-400 text-sm animate-fade-in">
                    <span className="material-symbols-outlined text-xl flex-shrink-0">check_circle</span>
                    <p>{successMsg}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Tiêu đề */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tiêu đề phản ánh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Rác thải ngõ 12 chưa được dọn..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                    />
                  </div>

                  {/* Phân loại loại sự cố */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Loại phản ánh <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 pr-10 appearance-none text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                      >
                        <option value="Rác chưa dọn">Rác chưa dọn / dồn ứ</option>
                        <option value="Xe rác trễ giờ">Xe thu gom đến trễ giờ</option>
                        <option value="Thái độ phục vụ">Lỗi thái độ của nhân viên thu gom</option>
                        <option value="Đổ rác sai quy định">Hành vi đổ rác trộm / sai quy định</option>
                        <option value="Ý kiến khác">Ý kiến / Đóng góp khác</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Địa điểm xảy ra sự cố */}
                  <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block border-b border-slate-200 dark:border-slate-800 pb-1.5">
                      Vị trí xảy ra sự cố
                    </span>
                    
                    {/* Tỉnh thành */}
                    <div className="space-y-1">
                      <select
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                        disabled={loadingProvinces}
                        className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm text-slate-800 dark:text-white focus:border-emerald-600 outline-none disabled:opacity-60"
                      >
                        <option value="">-- Chọn Tỉnh / Thành phố --</option>
                        {provinces.map(p => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Phường xã */}
                    <div className="space-y-1">
                      <select
                        value={selectedWard}
                        onChange={(e) => setSelectedWard(e.target.value)}
                        disabled={loadingWards || !selectedProvince}
                        className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm text-slate-800 dark:text-white focus:border-emerald-600 outline-none disabled:opacity-60"
                      >
                        <option value="">
                          {!selectedProvince ? 'Vui lòng chọn Tỉnh/Thành trước' : '-- Chọn Phường / Xã --'}
                        </option>
                        {wards.map(w => (
                          <option key={w.code} value={w.code}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tổ dân phố */}
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Số nhà, ngõ/ngách, Tổ dân cư..."
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm text-slate-800 dark:text-white focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Nội dung chi tiết */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Nội dung phản ánh chi tiết <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Mô tả cụ thể sự việc, thời gian xảy ra, vị trí chính xác để ban quản lý có thể hỗ trợ nhanh chóng nhất..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all resize-none text-sm leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 text-white font-bold rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-950 flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Đang gửi ý kiến...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">send</span>
                        <span>Gửi phản ánh</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Danh Sách Lịch Sử Phản Ánh - 3 cột trên grid 5 */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 min-h-[500px] flex flex-col transition-all duration-300 hover:shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">history</span>
                    Lịch sử phản ánh đã gửi
                  </h2>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                    {complaints.length} phản ánh
                  </span>
                </div>

                {loadingHistory ? (
                  <div className="flex-grow flex flex-col justify-center items-center py-20 space-y-4">
                    <span className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải lịch sử phản ánh...</p>
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="flex-grow flex flex-col justify-center items-center text-center p-8 space-y-4 my-auto">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/40 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-2 border border-slate-100 dark:border-slate-800/60">
                      <span className="material-symbols-outlined text-4xl">rate_review</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-white">
                      Chưa có phản ánh nào
                    </h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm">
                      Bạn chưa gửi bất kỳ phản ánh hoặc ý kiến đóng góp nào lên hệ thống. Các phản ánh đã gửi sẽ hiển thị tại đây.
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
                          {/* Card Header (Có thể click để mở rộng) */}
                          <div 
                            onClick={() => setExpandedComplaintId(isExpanded ? null : complaint.id)}
                            className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                          >
                            <div className="space-y-2 min-w-0 flex-grow">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
                                  {complaint.type}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {formatDate(complaint.created_at)}
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-slate-850 dark:text-white truncate">
                                {complaint.title}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">location_on</span>
                                {complaint.neighborhood ? `${complaint.neighborhood}, ` : ''}{complaint.ward}, {complaint.city}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3 justify-between md:justify-end">
                              {getStatusBadge(complaint.status)}
                              <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                keyboard_arrow_down
                              </span>
                            </div>
                          </div>

                          {/* Card Body - Chi tiết (Chỉ hiển thị khi mở rộng) */}
                          {isExpanded && (
                            <div className="px-5 pb-5 border-t border-slate-200/60 dark:border-slate-800/80 pt-4 bg-white/50 dark:bg-slate-900/40 space-y-4 animate-slide-down">
                              <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung phản ánh:</h4>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                  {complaint.description}
                                </p>
                              </div>

                              {/* Phản hồi của ban quản lý (nếu có) */}
                              {complaint.reply ? (
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
                              ) : (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-450 italic mt-4">
                                  <span className="material-symbols-outlined text-base">hourglass_empty</span>
                                  <span>Ý kiến của bạn đã được tiếp nhận và đang chờ phản hồi từ Ban quản lý khu dân cư.</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import authService from '../services/authService';

// Xác định base API URL động từ config authService
const API_BASE = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : 'http://localhost:5001/api';

export default function ResidentSchedules() {
  // Form State
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  // UI State
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [searched, setSearched] = useState(false);

  // Auto-schedule state for logged-in residents
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

  // User Profile: khởi tạo trực tiếp thay vì dùng useEffect để tránh setState-in-effect
  const currentUser = authService.getCurrentUser();



  // 1. Tải danh sách Tỉnh/Thành phố khi component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/address/provinces`);
        if (!res.ok) {
          throw new Error('Không thể tải danh sách Tỉnh/Thành phố');
        }
        const data = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error('Lỗi khi tải tỉnh thành:', err);
        setError('Có lỗi xảy ra khi kết nối hệ thống địa chính. Vui lòng tải lại trang.');
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // 2. Auto-fetch upcoming schedules for logged-in residents
  useEffect(() => {
    const fetchUpcomingSchedules = async () => {
      if (!authService.isAuthenticated()) return;
      
      setLoadingUpcoming(true);
      try {
        const token = await authService.getFreshToken();
        const res = await fetch(`${API_BASE}/resident/upcoming-schedules`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          console.warn('Không thể tải lịch thu gom khu vực.');
          return;
        }
        const data = await res.json();
        setUpcomingSchedules(data);
      } catch (err) {
        console.error('Lỗi khi tải lịch thu gom tự động:', err);
      } finally {
        setLoadingUpcoming(false);
      }
    };

    fetchUpcomingSchedules();
  }, []);

  // 3. Handler đổi Tỉnh/Thành phố: reset phường xã và tải mới
  // (đưa logic vào event handler thay vì useEffect để tránh setState-in-effect)
  const handleProvinceChange = async (e) => {
    const newProvince = e.target.value;
    setSelectedProvince(newProvince);
    setSelectedWard('');
    setWards([]); // Reset wards trong handler thay vì useEffect

    if (!newProvince) return;

    setLoadingWards(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/address/wards?provinceCode=${newProvince}`);
      if (!res.ok) {
        throw new Error('Không thể tải danh sách Phường/Xã');
      }
      const data = await res.json();
      setWards(data);
    } catch (err) {
      console.error('Lỗi khi tải phường xã:', err);
      setError('Không thể tải danh sách Phường/Xã cho khu vực này.');
    } finally {
      setLoadingWards(false);
    }
  };

  // 4. Xử lý tra cứu lịch thu gom
  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    if (!selectedProvince) {
      setError('Vui lòng chọn Tỉnh/Thành phố.');
      return;
    }

    // Tìm tên tỉnh/thành để gửi đi query
    const provinceObj = provinces.find(p => p.code.toString() === selectedProvince.toString());
    const wardObj = selectedWard
      ? wards.find(w => w.code.toString() === selectedWard.toString())
      : null;

    if (!provinceObj || (selectedWard && !wardObj)) {
      setError('Thông tin khu vực đã chọn không hợp lệ.');
      return;
    }

    setSearching(true);
    setError(null);
    setSearched(true);

    try {
      const cityParam = encodeURIComponent(provinceObj.name);
      const wardQuery = wardObj ? `&ward=${encodeURIComponent(wardObj.name)}` : '';
      const neighborhoodQuery = neighborhood.trim() ? `&neighborhood=${encodeURIComponent(neighborhood.trim())}` : '';
      const url = `${API_BASE}/schedules?city=${cityParam}${wardQuery}${neighborhoodQuery}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Lỗi hệ thống khi tải lịch thu gom.');
      }

      const data = await res.json();
      setSchedules(data);
    } catch (err) {
      console.error('Lỗi khi tra cứu lịch:', err);
      setError(err.message || 'Đã xảy ra lỗi khi tìm kiếm lịch thu gom. Vui lòng thử lại sau.');
    } finally {
      setSearching(false);
    }
  };

  // Helper hiển thị badge trạng thái lịch thu gom sinh động
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'đúng hạn':
      case 'hoàn thành':
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Đúng hạn
          </span>
        );
      case 'hoãn':
      case 'trì hoãn':
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Trì hoãn
          </span>
        );
      case 'hủy':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {status || 'Đang chờ'}
          </span>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-200/50 dark:border-emerald-900/30">
            <span className="material-symbols-outlined text-sm font-semibold">sparkles</span>
            Tra Cứu Thông Minh
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Tra cứu lịch thu gom rác
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm md:text-base">
            Nhập địa chỉ của bạn để biết chính xác thời gian xe thu gom rác hoạt động tại khu vực của mình.
          </p>
        </div>

        {/* ======= AUTO UPCOMING SCHEDULES SECTION (for logged-in residents) ======= */}
        {authService.isAuthenticated() && (
          <div className="mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">event_available</span>
                  Lịch thu gom khu vực của bạn
                </h2>
                {upcomingSchedules.length > 0 && (
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                    {upcomingSchedules.length} lịch sắp tới
                  </span>
                )}
              </div>

              {loadingUpcoming ? (
                <div className="flex items-center justify-center py-8 gap-3">
                  <span className="h-6 w-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải lịch thu gom khu vực...</p>
                </div>
              ) : upcomingSchedules.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                    <span className="material-symbols-outlined text-2xl">calendar_today</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Chưa có lịch thu gom sắp tới cho khu vực của bạn.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Bạn có thể tra cứu thủ công bằng biểu mẫu bên dưới.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingSchedules.map((schedule) => {
                    const schedDate = new Date(schedule.schedule_date);
                    const dayStr = schedDate.toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    });
                    const timeStr = schedDate.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const serviceTypeLabel = {
                      'Recycling': 'Rác tái chế',
                      'Organic': 'Rác hữu cơ',
                      'General': 'Rác sinh hoạt',
                    }[schedule.service_type] || schedule.service_type || 'Thu gom rác';

                    return (
                      <div
                        key={schedule.id}
                        className="bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-emerald-950/20 dark:to-slate-900/50 rounded-xl border border-emerald-100 dark:border-emerald-900/30 p-5 hover:shadow-md transition-all duration-300 group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded uppercase tracking-wider">
                            <span className="material-symbols-outlined text-xs">delete</span>
                            {serviceTypeLabel}
                          </span>
                        </div>

                        {/* Day */}
                        <div className="mb-3">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-1">Ngày thu gom</p>
                          <p className="text-base font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors capitalize">
                            {dayStr}
                          </p>
                        </div>

                        {/* Time */}
                        <div className="pt-3 border-t border-emerald-100/80 dark:border-emerald-900/20 flex items-center gap-2 text-sm">
                          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg">schedule</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{timeStr}</span>
                        </div>

                        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {schedule.neighborhood ? `${schedule.neighborhood}, ` : ''}
                          {schedule.ward || 'Phường/Xã chưa rõ'}
                          {schedule.city ? `, ${schedule.city}` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}



        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Filter Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-6 sticky top-24 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">
                  distance
                </span>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  Chọn khu vực tra cứu
                </h2>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl flex gap-3 text-rose-700 dark:text-rose-400 text-sm">
                  <span className="material-symbols-outlined text-xl flex-shrink-0">error</span>
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSearch} className="space-y-4">
                {/* Tỉnh/Thành phố Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tỉnh / Thành phố <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProvince}
                      onChange={handleProvinceChange}
                      disabled={loadingProvinces}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 pr-10 appearance-none text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all disabled:opacity-60"
                    >
                      <option value="">-- Chọn Tỉnh/Thành phố --</option>
                      {provinces.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                    {loadingProvinces ? (
                      <span className="absolute right-4 top-3.5 h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">
                        expand_more
                      </span>
                    )}
                  </div>
                </div>

                {/* Phường/Xã Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Phường / Xã <span className="text-slate-400 text-[10px] normal-case">(Không bắt buộc)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      disabled={loadingWards || !selectedProvince}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 pr-10 appearance-none text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all disabled:opacity-60"
                    >
                      <option value="">
                        {!selectedProvince ? 'Vui lòng chọn Tỉnh/Thành trước' : '-- Chọn Phường/Xã --'}
                      </option>
                      {wards.map(w => (
                        <option key={w.code} value={w.code}>
                          {w.name} ({w.districtName})
                        </option>
                      ))}
                    </select>
                    {loadingWards ? (
                      <span className="absolute right-4 top-3.5 h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">
                        expand_more
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Bỏ trống để tra cứu toàn bộ lịch trong Thành phố đã chọn.</p>
                </div>

                {/* Tổ Dân Cư Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tổ dân cư / Tổ dân phố (Không bắt buộc)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ví dụ: Tổ 12, Khu phố 4..."
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400">
                      home
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={searching || !selectedProvince}
                  className="w-full h-12 mt-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 text-white font-bold rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-950 flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 cursor-pointer disabled:cursor-not-allowed"
                >
                  {searching ? (
                    <>
                      <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Đang tìm kiếm...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">search</span>
                      <span>Tra cứu lịch</span>
                    </>
                  )}
                </button>
              </form>

              {/* Logged in helper note */}
              {currentUser && currentUser.address && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <div className="flex gap-2 items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-emerald-600 text-sm">verified_user</span>
                    <span>ĐỊA CHỈ ĐÃ LƯU</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {currentUser.address}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Results display area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 min-h-[480px] flex flex-col transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">calendar_today</span>
                  Lịch thu gom rác tìm thấy
                </h2>
                {schedules.length > 0 && (
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                    {schedules.length} Lịch
                  </span>
                )}
              </div>

              {/* Initial state: No search done yet */}
              {!searched && !searching && (
                <div className="flex-grow flex flex-col justify-center items-center text-center p-8 space-y-4 my-auto">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2">
                    <span className="material-symbols-outlined text-4xl">search_check</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 dark:text-white">
                    Sẵn sàng tra cứu
                  </h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm">
                    Vui lòng chọn Tỉnh/Thành và Phường/Xã bên trái sau đó nhấn nút "Tra cứu lịch" để hiển thị thông tin.
                  </p>
                </div>
              )}

              {/* Loading State */}
              {searching && (
                <div className="flex-grow flex flex-col justify-center items-center text-center p-8 space-y-4 my-auto">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full absolute top-0 left-0 animate-spin"></div>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Đang kết nối cơ sở dữ liệu và tải lịch thu gom...
                  </p>
                </div>
              )}

              {/* Empty State: No results found */}
              {searched && !searching && schedules.length === 0 && (
                <div className="flex-grow flex flex-col justify-center items-center text-center p-8 space-y-4 my-auto">
                  <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center text-amber-500 dark:text-amber-400 mb-2 border border-amber-100 dark:border-amber-950">
                    <span className="material-symbols-outlined text-4xl">calendar_today</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 dark:text-white">
                    Chưa có lịch thu gom
                  </h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md">
                    Rất tiếc, hiện tại hệ thống chưa cập nhật lịch thu gom rác chính thức cho khu vực bạn đã chọn.
                  </p>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-xl text-left max-w-md text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">info</span> Gợi ý dành cho bạn:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Đảm bảo tên Tổ dân cư nhập chính xác (Ví dụ: "Tổ 15" thay vì chỉ nhập "15").</li>
                      <li>Hoặc bỏ trống ô "Tổ dân cư" để xem toàn bộ lịch thu gom của Phường/Xã đó.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Success State: Show Schedules */}
              {searched && !searching && schedules.length > 0 && (
                <div className="space-y-4 flex-grow">
                  
                  {/* Results Header Info Card */}
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl flex-shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <div>
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                        Đã tìm thấy lịch thu gom khả dụng!
                      </p>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70 mt-0.5">
                        Lịch thu gom chính thức được áp dụng cho khu vực địa chỉ được lọc. Vui lòng chuẩn bị phân loại sẵn rác và mang ra đúng giờ quy định.
                      </p>
                    </div>
                  </div>

                  {/* List of Schedule Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {schedules.map((schedule) => (
                      <div 
                        key={schedule.id}
                        className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 group shadow-sm hover:shadow-md"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                              <span className="material-symbols-outlined text-xs font-bold">delete</span>
                              {schedule.trash_type || (schedule.service_type === 'Recycling' ? 'Rác tái chế (Nhựa, kim loại)' : schedule.service_type === 'Organic' ? 'Rác hữu cơ (Sinh hoạt)' : schedule.service_type === 'General' ? 'Rác thải sinh hoạt (Khác)' : schedule.service_type) || 'Rác sinh hoạt'}
                            </span>
                            {getStatusBadge(schedule.status)}
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Ngày thu gom</p>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {schedule.schedule_date ? (
                                new Date(schedule.schedule_date).toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              ) : (
                                'Chưa xác định'
                              )}
                            </h3>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            <span>{schedule.time_slot || (schedule.schedule_date ? new Date(schedule.schedule_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '17:00 - 19:00')}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            <span>
                              {schedule.neighborhood ? `${schedule.neighborhood}, ` : ''}
                              {schedule.ward ? `${schedule.ward}, ` : ''}
                              {schedule.city || 'Khu vực chưa rõ'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Informative Tip Box */}
                  <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl flex gap-3 text-slate-500 dark:text-slate-400 text-xs">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-lg flex-shrink-0">
                      info
                    </span>
                    <p className="leading-relaxed">
                      Thông báo nhắc nhở tự động sẽ được hiển thị trực tiếp trên ứng dụng trước 30 phút khi xe thu gom rác đi qua khu vực của bạn.
                    </p>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

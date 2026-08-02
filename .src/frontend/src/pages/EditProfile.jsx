import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { ROLES, normalizeRole } from '../constants/roles';

const API_BASE = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : 'http://localhost:5001/api';

const ROLE_LABELS = {
  [ROLES.RESIDENT]: 'Cư dân',
  [ROLES.COLLECTOR]: 'Nhân viên thu gom',
  [ROLES.MANAGER]: 'Quản lý',
  [ROLES.ADMIN]: 'Quản trị viên',
};

const ROLE_COLORS = {
  [ROLES.RESIDENT]: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
  [ROLES.COLLECTOR]: 'bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400',
  [ROLES.MANAGER]: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400',
  [ROLES.ADMIN]: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
};

const ROLE_DESCRIPTIONS = {
  [ROLES.RESIDENT]: 'Cập nhật thông tin cá nhân và khu vực thu gom rác của bạn',
  [ROLES.COLLECTOR]: 'Cập nhật thông tin cá nhân của nhân viên thu gom',
  [ROLES.MANAGER]: 'Cập nhật thông tin cá nhân của quản lý',
  [ROLES.ADMIN]: 'Cập nhật thông tin cá nhân của quản trị viên',
};

export default function EditProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [form, setForm] = useState(() => {
    const current = authService.getCurrentUser();
    return {
      fullName: current?.fullName || '',
      phone: current?.phone || '',
      address: current?.address || '',
      area: current?.area || '',
    };
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Address dropdown states
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Lấy vị trí hiện tại và reverse geocode bằng Nominatim (OpenStreetMap)
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi&addressdetails=1`,
            { headers: { 'User-Agent': 'EcoSchedule/1.0' } }
          );
          if (!res.ok) throw new Error('Không thể lấy thông tin địa chỉ.');
          const data = await res.json();
          const addr = data.address || {};
          // Build readable address: house_number + road + suburb/quarter
          const parts = [
            addr.house_number,
            addr.road,
            addr.suburb || addr.quarter || addr.neighbourhood,
          ].filter(Boolean);
          const streetAddress = parts.join(', ') || data.display_name || '';
          setForm(prev => ({ ...prev, address: streetAddress }));
          setMsg({ type: 'success', text: `Đã xác định vị trí: ${streetAddress}` });
        } catch (err) {
          setGeoError('Không thể chuyển tọa độ thành địa chỉ. Vui lòng thử lại.');
          console.error('Reverse geocode error:', err);
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('Không thể xác định vị trí hiện tại.');
            break;
          case err.TIMEOUT:
            setGeoError('Quá thời gian chờ lấy vị trí. Vui lòng thử lại.');
            break;
          default:
            setGeoError('Lỗi không xác định khi lấy vị trí.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Load provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch(`${API_BASE}/address/provinces`);
        if (res.ok) {
          const data = await res.json();
          setProvinces(data);
        }
      } catch (err) {
        console.error('Lỗi khi tải tỉnh thành:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  const handleProvinceChange = async (e) => {
    const newProvince = e.target.value;
    setSelectedProvince(newProvince);
    setSelectedWard('');
    setWards([]);

    if (!newProvince) return;

    setLoadingWards(true);
    try {
      const res = await fetch(`${API_BASE}/address/wards?provinceCode=${newProvince}`);
      if (res.ok) {
        const data = await res.json();
        setWards(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải phường xã:', err);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setSaving(true);
    try {
      // Build area from dropdowns if user is resident and has selected values
      const userRole = normalizeRole(user?.role);
      let updatedForm = { ...form };

      if (userRole === ROLES.RESIDENT && selectedProvince && selectedWard) {
        const provinceObj = provinces.find(p => p.code.toString() === selectedProvince.toString());
        const wardObj = wards.find(w => w.code.toString() === selectedWard.toString());
        if (wardObj && provinceObj) {
          updatedForm.area = `${wardObj.name}, ${provinceObj.name}`;
        }
      }

      const token = await authService.getFreshToken();
      const res = await fetch(`${API_BASE}/resident/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu thất bại.');

      // Cập nhật storage để header/navbar hiển thị đúng
      const storage = localStorage.getItem('eco_user') ? localStorage : sessionStorage;
      const stored = JSON.parse(storage.getItem('eco_user') || '{}');
      const updated = { ...stored, ...data.updated };
      storage.setItem('eco_user', JSON.stringify(updated));
      setUser(updated);
      setForm(prev => ({ ...prev, area: updated.area || prev.area }));

      // Dispatch event so Header picks up the name change
      window.dispatchEvent(new Event('authChange'));

      setMsg({ type: 'success', text: 'Hồ sơ đã được cập nhật thành công!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const userRole = normalizeRole(user?.role);
  const roleLabel = ROLE_LABELS[userRole] || 'Cư dân';
  const roleColor = ROLE_COLORS[userRole] || ROLE_COLORS[ROLES.RESIDENT];
  const roleDescription = ROLE_DESCRIPTIONS[userRole] || ROLE_DESCRIPTIONS[ROLES.RESIDENT];

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 py-10 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">

        {/* Page Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-2xl">manage_accounts</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Chỉnh sửa hồ sơ</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{roleDescription}</p>
            </div>
          </div>
        </div>

        {/* Profile Card — read-only overview */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 mb-6 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {(user.fullName || user.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-slate-800 dark:text-white truncate">{user.fullName || 'Chưa cập nhật'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block px-2 py-0.5 ${roleColor} text-[10px] font-bold rounded-full uppercase tracking-wide`}>
                  {roleLabel}
                </span>
                {user.area && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {user.area}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {msg.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm border transition-all ${
            msg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
          }`}>
            <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">
              {msg.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="font-medium">{msg.text}</span>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">edit_note</span>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Thông tin cá nhân</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Họ và tên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 text-lg">person</span>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 text-lg">phone</span>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0912 345 678"
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Địa chỉ chi tiết */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Địa chỉ chi tiết (Số nhà, tổ, đường...)
              </label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 text-lg">home</span>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Đường ABC, Tổ 5"
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
                {userRole === ROLES.RESIDENT && (
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={geoLoading}
                    title="Lấy vị trí hiện tại để tự động điền địa chỉ"
                    className="h-12 px-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 font-semibold rounded-xl text-sm hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-all flex items-center gap-2 disabled:opacity-60 flex-shrink-0"
                  >
                    {geoLoading ? (
                      <>
                        <span className="h-4 w-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                        <span className="hidden sm:inline">Đang định vị...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">my_location</span>
                        <span className="hidden sm:inline">Lấy vị trí</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              {geoError && (
                <p className="mt-2 text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {geoError}
                </p>
              )}
            </div>

            {/* Area dropdowns — only for residents */}
            {userRole === ROLES.RESIDENT && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Tỉnh/Thành phố Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Tỉnh / Thành phố
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 text-lg">map</span>
                      <select
                        value={selectedProvince}
                        onChange={handleProvinceChange}
                        disabled={loadingProvinces}
                        className="w-full h-12 pl-11 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all appearance-none disabled:opacity-60"
                      >
                        <option value="">-- Chọn Tỉnh/Thành phố --</option>
                        {provinces.map(p => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                      {loadingProvinces ? (
                        <span className="absolute right-4 top-3.5 h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">expand_more</span>
                      )}
                    </div>
                  </div>

                  {/* Phường/Xã Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Phường / Xã
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 text-lg">distance</span>
                      <select
                        value={selectedWard}
                        onChange={(e) => setSelectedWard(e.target.value)}
                        disabled={loadingWards || !selectedProvince}
                        className="w-full h-12 pl-11 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all appearance-none disabled:opacity-60"
                      >
                        <option value="">
                          {!selectedProvince ? 'Vui lòng chọn Tỉnh/Thành trước' : '-- Chọn Phường/Xã --'}
                        </option>
                        {wards.map(w => (
                          <option key={w.code} value={w.code}>{w.name} ({w.districtName})</option>
                        ))}
                      </select>
                      {loadingWards ? (
                        <span className="absolute right-4 top-3.5 h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">expand_more</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current area display */}
                {form.area && (
                  <div className="p-3.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 rounded-xl flex gap-2.5 text-xs text-sky-700 dark:text-sky-300">
                    <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">info</span>
                    <p>
                      <strong>Khu vực hiện tại:</strong> {form.area}.
                      Chọn Tỉnh/TP và Phường/Xã ở trên để thay đổi. Khu vực này dùng để hiển thị lịch thu gom tự động.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-7 h-12 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-md shadow-emerald-600/10"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-7 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

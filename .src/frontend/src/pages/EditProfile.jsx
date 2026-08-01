import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { ROLES, normalizeRole } from '../constants/roles';

const API_BASE = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : 'http://localhost:5001/api';

const FIELDS = [
  { name: 'fullName', label: 'Họ và tên', icon: 'person', placeholder: 'Nguyễn Văn A' },
  { name: 'phone', label: 'Số điện thoại', icon: 'phone', placeholder: '0912 345 678' },
  { name: 'address', label: 'Địa chỉ nhà', icon: 'home', placeholder: '123 Đường ABC, Quận 1', full: true },
  { name: 'area', label: 'Khu vực (để hiển thị lịch thu gom tự động)', icon: 'location_on', placeholder: 'Phường Bến Nghé, Quận 1, TP.HCM', full: true, rolesOnly: [ROLES.RESIDENT] },
];

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

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setSaving(true);
    try {
      const token = await authService.getFreshToken();
      const res = await fetch(`${API_BASE}/resident/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu thất bại.');

      // Cập nhật storage để header/navbar hiển thị đúng
      const storage = localStorage.getItem('eco_user') ? localStorage : sessionStorage;
      const stored = JSON.parse(storage.getItem('eco_user') || '{}');
      const updated = { ...stored, ...data.updated };
      storage.setItem('eco_user', JSON.stringify(updated));
      setUser(updated);

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
  const visibleFields = FIELDS.filter(f => !f.rolesOnly || f.rolesOnly.includes(userRole));

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

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {visibleFields.map(({ name, label, icon, placeholder, full }) => (
              <div key={name} className={full ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {label}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 text-lg">{icon}</span>
                  <input
                    type="text"
                    value={form[name]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>
            ))
            }

            {/* Area Helper Note — only for residents */}
            {userRole === ROLES.RESIDENT && (
            <div className="sm:col-span-2">
              <div className="p-3.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 rounded-xl flex gap-2.5 text-xs text-sky-700 dark:text-sky-300">
                <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">info</span>
                <p>
                  <strong>Khu vực</strong> được dùng để tự động hiển thị lịch thu gom rác tại khu vực bạn đang sinh sống.
                  Hãy nhập chính xác tên Phường/Xã hoặc Quận/Huyện (ví dụ: &quot;Phường Bến Nghé, Quận 1&quot;).
                </p>
              </div>
            </div>
            )}

            {/* Actions */}
            <div className="sm:col-span-2 flex gap-3 pt-2">
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

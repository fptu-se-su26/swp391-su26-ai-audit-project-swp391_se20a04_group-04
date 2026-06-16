import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/userService';
import { ROLES, normalizeRole, REGISTER_ROLES } from '../../constants/roles';

export default function UserManagement({ hideHeader = false }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    uid: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: ROLES.RESIDENT
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, roleFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getUsers(page, limit, debouncedSearch, roleFilter);
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ uid: '', email: '', password: '', fullName: '', phone: '', role: ROLES.RESIDENT });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setFormData({
      uid: user.uid,
      email: user.email,
      password: '', // Không sửa mật khẩu
      fullName: user.fullName,
      phone: user.phone || '',
      role: normalizeRole(user.role)
    });
    setShowModal(true);
  };

  const handleDelete = async (uid) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Thao tác không thể hoàn tác!')) return;
    try {
      await deleteUser(uid);
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa.');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'add') {
        await createUser(formData);
      } else {
        await updateUser(formData.uid, formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (roleStr) => {
    const r = normalizeRole(roleStr);
    if (r === ROLES.ADMIN) return <span className="px-2 py-1 rounded bg-rose-100 text-rose-700 text-xs font-bold">Admin</span>;
    if (r === ROLES.MANAGER) return <span className="px-2 py-1 rounded bg-sky-100 text-sky-700 text-xs font-bold">Manager</span>;
    if (r === ROLES.COLLECTOR) return <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold">Collector</span>;
    return <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">Resident</span>;
  };

  return (
    <div className={hideHeader ? "" : "min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 md:px-8 animate-fade-in"}>
      <div className={hideHeader ? "space-y-6" : "max-w-7xl mx-auto space-y-6"}>
        {!hideHeader && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                <Link to="/dashboard" className="hover:text-primary">Bảng điều khiển</Link>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="text-primary font-semibold">Quản lý</span>
              </nav>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý người dùng</h1>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <span className="material-symbols-outlined">person_add</span>
              Thêm người dùng
            </button>
          </div>
        )}

        {hideHeader && (
          <div className="flex justify-end mb-4">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <span className="material-symbols-outlined">person_add</span>
              Thêm người dùng
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white"
              />
            </div>
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white"
            >
              <option value="">Tất cả vai trò</option>
              <option value={ROLES.ADMIN}>Quản trị hệ thống (Admin)</option>
              <option value={ROLES.MANAGER}>Quản lý công ty (Manager)</option>
              <option value={ROLES.COLLECTOR}>Nhân viên thu gom (Collector)</option>
              <option value={ROLES.RESIDENT}>Cư dân (Resident)</option>
            </select>
          </div>

          {error && <div className="mb-4 text-rose-600 bg-rose-50 p-4 rounded-xl">{error}</div>}

          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Tên hiển thị</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Email</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Trạng thái Email</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Vai trò</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Mã UID</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">Đang tải dữ liệu...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">Không tìm thấy người dùng nào.</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.uid} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-5 text-sm text-slate-800 dark:text-white font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                            {(u.fullName || u.email || 'U')[0].toUpperCase()}
                          </div>
                          {u.fullName}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-sm text-slate-600 dark:text-slate-300">{u.email}</td>
                      <td className="py-4 px-5">
                        {u.emailVerified ? (
                          <span className="px-2 py-1 flex items-center gap-1 w-max rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Đã xác nhận
                          </span>
                        ) : (
                          <span className="px-2 py-1 flex items-center gap-1 w-max rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-[14px]">cancel</span>
                            Chưa xác nhận
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">{getRoleBadge(u.role)}</td>
                      <td className="py-4 px-5 text-xs text-slate-400 font-mono truncate max-w-[100px]">{u.uid}</td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(u)} className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-colors" title="Sửa">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => handleDelete(u.uid)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors" title="Xóa">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-6 gap-4">
              <span className="text-sm text-slate-500">Trang {page} / {totalPages} (Tổng: {total} người dùng)</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Tiếp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-xl text-slate-800 dark:text-white">
                {modalMode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {modalMode === 'add' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email *</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white transition-all" placeholder="user@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mật khẩu *</label>
                    <input required type="password" name="password" value={formData.password} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white transition-all" placeholder="******" />
                  </div>
                </div>
              )}
              {modalMode === 'edit' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                  <input type="text" value={formData.email} disabled className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 outline-none cursor-not-allowed" />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Họ và tên *</label>
                <input required type="text" name="fullName" value={formData.fullName} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white transition-all" placeholder="Nhập họ và tên..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Vai trò</label>
                  <select name="role" value={formData.role} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white transition-all">
                    <option value={ROLES.ADMIN}>Quản trị viên (Admin)</option>
                    {REGISTER_ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Số điện thoại</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white transition-all" placeholder="09xxxx..." />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-colors">Hủy</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-emerald-600 font-semibold disabled:opacity-50 transition-colors flex items-center gap-2">
                  {saving && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'Citizen', area: '' });
  
  // Error / Loading
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers(search, roleFilter);
      setUsers(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Lỗi khi tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ fullName: '', email: '', password: '', role: 'Citizen', area: '' });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setCurrentUser(user);
    setFormData({ fullName: user.fullName || '', email: user.email || '', password: '', role: user.role || 'Citizen', area: user.area || '' });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = async (uid) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      await userService.deleteUser(uid);
      setUsers(users.filter(u => u.uid !== uid));
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa người dùng');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMsg('');
    try {
      if (modalMode === 'add') {
        await userService.createUser(formData);
      } else {
        await userService.updateUser(currentUser.uid, formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl text-emerald-600">manage_accounts</span>
          Quản lý
        </h1>
        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">person_add</span>
          Thêm người dùng
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Thanh tìm kiếm */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="relative flex-1 w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          
          <div className="w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Tất cả Vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Citizen">Citizen</option>
              <option value="Garbage Collector">Garbage Collector</option>
              <option value="Collection Company Manager">Collection Company Manager</option>
            </select>
          </div>
        </div>

        {/* Bảng danh sách */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 text-sm border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 font-semibold">Họ tên</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Vai trò</th>
                <th className="px-6 py-4 font-semibold">Khu vực</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {errorMsg ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-rose-500 font-medium">
                    Lỗi: {errorMsg}
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500">Không tìm thấy người dùng nào.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                          {u.fullName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        {u.fullName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'Admin' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 
                        u.role === 'Garbage Collector' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        u.role === 'Collection Company Manager' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                      }`}>
                        {u.role || 'Citizen'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.area || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditModal(u)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Sửa">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handleDelete(u.uid)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2" title="Xóa">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {modalMode === 'add' ? 'Thêm người dùng' : 'Sửa người dùng'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm border border-rose-200">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Họ tên</label>
                  <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email {modalMode === 'edit' && '(Không sửa được)'}</label>
                  <input required disabled={modalMode === 'edit'} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu {modalMode === 'edit' && '(Bỏ trống nếu không đổi)'}</label>
                  <input required={modalMode === 'add'} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vai trò</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700">
                    <option value="Admin">Admin</option>
                    <option value="Citizen">Citizen</option>
                    <option value="Garbage Collector">Garbage Collector</option>
                    <option value="Collection Company Manager">Collection Company Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Khu vực</label>
                  <input type="text" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Hủy
                </button>
                <button disabled={submitLoading} type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center gap-2">
                  {submitLoading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

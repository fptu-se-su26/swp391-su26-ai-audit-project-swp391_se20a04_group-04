import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import { ROLES } from '../../constants/roles';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Current item selected for view/edit/delete
  const [selectedItem, setSelectedItem] = useState(null);

  // Form data for Create/Edit
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system',
    targetRole: 'all',
  });

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationService.getAdminNotifications(roleFilter !== 'all' ? roleFilter : '');
      setNotifications(res.data || res || []);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleRoleFilterChange = (e) => {
    setCurrentPage(1); // Reset trang khi đổi bộ lọc
    setRoleFilter(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setSelectedItem(null);
    setFormData({
      title: '',
      message: '',
      type: 'system',
      targetRole: 'all',
    });
    setIsModalOpen(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (notif) => {
    setSelectedItem(notif);
    setFormData({
      title: notif.title || '',
      message: notif.content || '',
      type: notif.type || 'system',
      targetRole: notif.targetRole || 'all',
    });
    setIsModalOpen(true);
  };

  // Mở modal xóa
  const handleOpenDelete = (notif) => {
    setSelectedItem(notif);
    setIsDeleteOpen(true);
  };

  // Mở modal xem chi tiết
  const handleOpenDetail = (notif) => {
    setSelectedItem(notif);
    setIsDetailOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedItem) {
        // Cập nhật
        await notificationService.updateAdminNotification(selectedItem.id, {
          title: formData.title,
          message: formData.message,
          type: formData.type,
          targetRole: formData.targetRole,
        });
      } else {
        // Tạo mới
        await notificationService.createNotification({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          targetRole: formData.targetRole,
        });
      }

      setIsModalOpen(false);
      fetchNotifications();
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra khi lưu thông báo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await notificationService.deleteAdminNotification(selectedItem.id);
      setIsDeleteOpen(false);
      setSelectedItem(null);
      fetchNotifications();
    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra khi xóa thông báo.');
    } finally {
      setSaving(false);
    }
  };

  // --- Tính toán hiển thị thời gian ---
  const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const timeAgo = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return "Vừa xong";
  };

  // --- Phân trang ---
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const currentData = notifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // --- Render Badges ---
  const getTargetBadge = (role) => {
    if (role === 'all' || !role) return <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold">Tất cả</span>;
    if (role === ROLES.ADMIN) return <span className="px-2 py-1 rounded bg-rose-100 text-rose-700 text-xs font-bold">Admin</span>;
    if (role === ROLES.MANAGER) return <span className="px-2 py-1 rounded bg-sky-100 text-sky-700 text-xs font-bold">Quản lý</span>;
    if (role === ROLES.COLLECTOR) return <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold">Nhân viên</span>;
    return <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">Cư dân</span>;
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'billing': return <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">Thanh toán</span>;
      case 'schedule': return <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">Lịch trình</span>;
      case 'update': return <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-bold">Cập nhật</span>;
      case 'system':
      default: return <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold">Hệ thống</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 md:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <Link to="/dashboard" className="hover:text-primary">Bảng điều khiển</Link>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-primary font-semibold">Thông báo</span>
            </nav>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">notifications</span>
              Quản lý Thông báo
            </h1>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            <span className="material-symbols-outlined">add_alert</span>
            Tạo thông báo mới
          </button>
        </div>

        {/* Filters & Table Container */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lọc theo đối tượng nhận:</div>
            <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              className="w-full md:w-64 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white"
            >
              <option value="all">Tất cả thông báo</option>
              <option value={ROLES.RESIDENT}>Cư dân (Resident)</option>
              <option value={ROLES.MANAGER}>Quản lý (Manager)</option>
              <option value={ROLES.COLLECTOR}>Nhân viên (Collector)</option>
            </select>
          </div>

          {error && <div className="mb-4 text-rose-600 bg-rose-50 p-4 rounded-xl">{error}</div>}

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700 mb-4">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Tiêu đề</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Loại</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Đối tượng</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Thời gian tạo</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400">Đang tải dữ liệu...</td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400">Không tìm thấy thông báo nào.</td>
                  </tr>
                ) : (
                  currentData.map((n, idx) => {
                    return (
                      <tr key={n.id || idx} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td 
                          className="py-4 px-5 text-sm text-slate-800 dark:text-white font-semibold max-w-xs truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleOpenDetail(n)}
                        >
                          {n.title || 'Không có tiêu đề'}
                        </td>
                        <td className="py-4 px-5">
                          {getTypeBadge(n.type)}
                        </td>
                        <td className="py-4 px-5">
                          {getTargetBadge(n.targetRole)}
                        </td>
                        <td className="py-4 px-5 text-sm">
                          <div className="text-slate-800 dark:text-white font-medium">
                            {formatDateTime(n.created_at || n.sent_at)}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {timeAgo(n.created_at || n.sent_at)}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenDetail(n)} 
                              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors" 
                              title="Xem chi tiết"
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(n)} 
                              className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-colors" 
                              title="Sửa"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleOpenDelete(n)} 
                              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors" 
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-2 text-sm text-slate-500">
              <div>
                Đang hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, notifications.length)} trên tổng số {notifications.length} thông báo.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Trang trước
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal Xem Chi Tiết */}
      {isDetailOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">feed</span>
                Chi tiết Thông báo
              </h2>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{selectedItem.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs mb-4">
                  {getTypeBadge(selectedItem.type)}
                  {getTargetBadge(selectedItem.targetRole)}
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-600">
                    {formatDateTime(selectedItem.created_at || selectedItem.sent_at)} • {timeAgo(selectedItem.created_at || selectedItem.sent_at)}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed border border-slate-100 dark:border-slate-800">
                {selectedItem.content || selectedItem.message}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo / Sửa Thông Báo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{selectedItem ? 'edit_square' : 'add_alert'}</span>
                {selectedItem ? 'Sửa Thông báo' : 'Tạo Thông báo'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="create-notification-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tiêu đề thông báo *</label>
                  <input
                    required
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="VD: Cập nhật lịch thu gom rác..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nội dung chi tiết *</label>
                  <textarea
                    required
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="Nhập nội dung chi tiết thông báo..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Loại thông báo</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white"
                    >
                      <option value="system">Hệ thống (System)</option>
                      <option value="schedule">Lịch trình (Schedule)</option>
                      <option value="billing">Thanh toán (Billing)</option>
                      <option value="update">Cập nhật (Update)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Đối tượng nhận</label>
                    <select
                      name="targetRole"
                      value={formData.targetRole}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white"
                    >
                      <option value="all">Tổng (Tất cả user)</option>
                      <option value={ROLES.RESIDENT}>Chỉ Cư dân</option>
                      <option value={ROLES.MANAGER}>Chỉ Quản lý</option>
                      <option value={ROLES.COLLECTOR}>Chỉ Nhân viên</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="create-notification-form"
                disabled={saving}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {selectedItem ? 'Lưu thay đổi' : 'Tạo thông báo'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa Thông báo */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center border border-slate-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Xóa thông báo?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Bạn có chắc chắn muốn xóa thông báo "{selectedItem?.title}" không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                disabled={saving}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={saving}
              >
                {saving ? 'Đang xóa...' : 'Có, Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

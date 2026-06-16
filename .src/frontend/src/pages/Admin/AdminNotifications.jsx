import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import { ROLES } from '../../constants/roles';
import { Plus, RefreshCw, Search, ListFilter, Filter, Eye, Pencil, Trash2, Check } from 'lucide-react';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

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

  useEffect(() => {
    fetchNotifications();
    setCurrentPage(1);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      // Tải tất cả thông báo để hỗ trợ tìm kiếm toàn cục theo Keyword
      const res = await notificationService.getAdminNotifications('');
      setNotifications(res.data || res || []);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
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
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'chiều' : 'sáng';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
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

  // Filter Data
  const filteredData = notifications.filter(n => {
    const matchRole = roleFilter === 'all' || n.targetRole === roleFilter;
    const matchSearch = (n.title || '').toLowerCase().includes(searchKeyword.toLowerCase());
    return matchRole && matchSearch;
  });

  // --- Phân trang ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
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
    if (role === 'all' || !role) return <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-semibold">Tất cả</span>;
    if (role === ROLES.ADMIN) return <span className="px-3 py-1 rounded bg-rose-50 text-rose-600 text-xs font-semibold">Admin</span>;
    if (role === ROLES.MANAGER) return <span className="px-3 py-1 rounded bg-sky-50 text-sky-600 text-xs font-semibold">Quản lý</span>;
    if (role === ROLES.COLLECTOR) return <span className="px-3 py-1 rounded bg-amber-50 text-amber-600 text-xs font-semibold">Nhân viên</span>;
    return <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-semibold">Cư dân</span>;
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'billing': return <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-semibold">Thanh toán</span>;
      case 'schedule': return <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-semibold">Lịch trình</span>;
      case 'update': return <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-semibold">Cập nhật</span>;
      case 'system':
      default: return <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-semibold">Hệ thống</span>;
    }
  };

  return (
    <div className="min-h-screen bg-white py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          
          {/* Top Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <button
              onClick={handleOpenCreate}
              className="w-full md:w-auto bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Tạo mới
            </button>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Refresh Button */}
              <button 
                onClick={fetchNotifications}
                className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
                title="Tải lại"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>

              {/* Search */}
              <div className="relative flex-1 md:flex-none">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Tiêu đề" 
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
                />
              </div>

              {/* Filter Icons (Visual representation) */}
              <button className="hidden sm:flex p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors">
                <ListFilter size={18} />
              </button>
              
              {/* Role Filter Dropdown */}
              <div className="relative">
                <select 
                  value={roleFilter} 
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-gray-600 bg-white cursor-pointer"
                >
                  <option value="all">Tất cả đối tượng</option>
                  <option value={ROLES.RESIDENT}>Cư dân</option>
                  <option value={ROLES.MANAGER}>Quản lý</option>
                  <option value={ROLES.COLLECTOR}>Nhân viên</option>
                </select>
                <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {error && <div className="mb-4 text-rose-600 bg-rose-50 p-4 rounded-xl text-sm">{error}</div>}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-emerald-100">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#f0fdf4] border-b border-emerald-100">
                <tr>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 uppercase tracking-wider">Tiêu đề</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 uppercase tracking-wider">Loại</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 uppercase tracking-wider">Đối tượng</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 uppercase tracking-wider">Thời gian tạo</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400 text-sm">Đang tải dữ liệu...</td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400 text-sm">Không tìm thấy thông báo nào phù hợp.</td>
                  </tr>
                ) : (
                  currentData.map((n, idx) => {
                    const isSystem = n.type === 'system';
                    
                    return (
                      <tr key={n.id || idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-5 text-sm text-gray-800 font-medium max-w-xs truncate">
                          {n.title || 'Không có tiêu đề'}
                        </td>
                        <td className="py-4 px-5">
                          {getTypeBadge(n.type)}
                        </td>
                        <td className="py-4 px-5">
                          {getTargetBadge(n.targetRole)}
                        </td>
                        <td className="py-4 px-5 text-sm">
                          <div className="text-gray-800">
                            {formatDateTime(n.created_at || n.sent_at)}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {timeAgo(n.created_at || n.sent_at)}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenDetail(n)} 
                              className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors" 
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(n)} 
                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors" 
                              title="Sửa"
                            >
                              <Pencil size={16} />
                            </button>
                            {isSystem ? (
                              <button 
                                onClick={() => handleOpenDelete(n)} 
                                className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors group relative" 
                              >
                                <Check size={16} />
                                <span className="absolute bottom-full mb-2 right-0 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                  Mark as Read
                                </span>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleOpenDelete(n)} 
                                className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors" 
                                title="Xóa"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
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
            <div className="flex justify-between items-center mt-6 text-sm text-gray-500">
              <div>
                Đang hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} trên tổng số {filteredData.length} thông báo.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Trang trước
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                Chi tiết Thông báo
              </h2>
              <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedItem.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs mb-4">
                  {getTypeBadge(selectedItem.type)}
                  {getTargetBadge(selectedItem.targetRole)}
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">
                    {formatDateTime(selectedItem.created_at || selectedItem.sent_at)}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-gray-700 whitespace-pre-wrap text-sm leading-relaxed border border-gray-100">
                {selectedItem.content || selectedItem.message}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-6 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo / Sửa Thông Báo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {selectedItem ? 'Sửa Thông báo' : 'Tạo Thông báo mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="create-notification-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiêu đề *</label>
                  <input
                    required
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Nhập tiêu đề..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nội dung *</label>
                  <textarea
                    required
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="Nhập nội dung chi tiết..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại thông báo</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                    >
                      <option value="system">Hệ thống</option>
                      <option value="schedule">Lịch trình</option>
                      <option value="billing">Thanh toán</option>
                      <option value="update">Cập nhật</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Đối tượng</label>
                    <select
                      name="targetRole"
                      value={formData.targetRole}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-800 text-sm"
                    >
                      <option value="all">Tất cả user</option>
                      <option value={ROLES.RESIDENT}>Chỉ Cư dân</option>
                      <option value={ROLES.MANAGER}>Chỉ Quản lý</option>
                      <option value={ROLES.COLLECTOR}>Chỉ Nhân viên</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="create-notification-form"
                disabled={saving}
                className="px-5 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Đang lưu...' : 'Lưu thông báo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa Thông báo */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center border border-gray-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Xóa thông báo?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-2 rounded-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                disabled={saving}
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

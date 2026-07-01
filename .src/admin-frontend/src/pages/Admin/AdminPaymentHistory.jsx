import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminTransactions } from '../../services/paymentService';
import { RefreshCw, Search, Eye } from 'lucide-react';
import { ROLES, normalizeRole } from '../../constants/roles';

export default function AdminPaymentHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminTransactions('');
      setTransactions(res.data || res || []);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải lịch sử giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleOpenDetail = (tx) => {
    setSelectedItem(tx);
    setIsDetailOpen(true);
  };

  const formatDate = (value) => {
    if (!value) return '';
    let date;
    if (value && typeof value === 'object' && value._seconds !== undefined) {
      date = new Date(value._seconds * 1000);
    } else if (value && typeof value === 'object' && value.seconds !== undefined) {
      date = new Date(value.seconds * 1000);
    } else {
      date = new Date(value);
    }

    if (isNaN(date.getTime())) return 'Ngày không hợp lệ';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'chiều' : 'sáng';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };



  // Filter Data
  const filteredData = transactions.filter(tx => {
    const searchString = `${tx.transactionId} ${tx.invoiceId} ${tx.userName} ${tx.userEmail}`.toLowerCase();
    const matchSearch = searchString.includes(searchKeyword.toLowerCase());
    const matchRole = roleFilter === '' || normalizeRole(tx.userRole) === roleFilter;
    return matchSearch && matchRole;
  });

  // Phân trang
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Title Optional */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <Link to="/dashboard" className="hover:text-emerald-600 transition-colors">Bảng điều khiển</Link>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Thanh toán</span>
            </nav>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">history</span>
              Lịch sử Giao dịch
            </h1>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-emerald-100 dark:border-slate-800 p-6">
          
          {/* Top Controls */}
          <div className="flex flex-col md:flex-row justify-end items-center mb-6 gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Refresh Button */}
              <button 
                onClick={fetchData}
                className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
                title="Tải lại"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>

              {/* Search */}
              <div className="relative flex-1 md:flex-none">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm theo mã, tên, email..." 
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-64 pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 dark:text-white transition-all rounded-xl"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 dark:text-white"
              >
                <option value="">Tất cả vai trò</option>
                <option value={ROLES.RESIDENT}>Cư dân</option>
                <option value={ROLES.MANAGER}>Quản lý</option>
                <option value={ROLES.COLLECTOR}>Nhân viên thu gom</option>
                <option value={ROLES.ADMIN}>Admin</option>
              </select>

            </div>
          </div>

          {error && <div className="mb-4 text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900 border p-4 rounded-xl text-sm">{error}</div>}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-emerald-100 dark:border-slate-700">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#f0fdf4] dark:bg-slate-800 border-b border-emerald-100 dark:border-slate-700">
                <tr>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Mã GD / Hóa đơn</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Người dùng</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Số tiền</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Ngày giờ</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">Đang tải dữ liệu...</td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">Không tìm thấy giao dịch nào phù hợp.</td>
                  </tr>
                ) : (
                  currentData.map((tx, idx) => (
                    <tr key={tx.id || idx} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-5 text-sm text-slate-800 dark:text-white font-medium">
                        {tx.transactionId || tx.invoiceId || 'N/A'}
                      </td>
                      <td className="py-4 px-5 text-sm text-slate-600 dark:text-slate-300">
                        {tx.userName || tx.userEmail || tx.userId || 'Ẩn danh'}
                      </td>
                      <td className="py-4 px-5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {tx.amount ? `${tx.amount.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                      </td>
                      <td className="py-4 px-5">
                        {tx.status === 'paid' || tx.status === 'thành công' || tx.status === 'success' ? (
                          <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Thành công
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {tx.status || 'Chưa rõ'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(tx.createdAt || tx.date || tx.paidAt)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button 
                          onClick={() => handleOpenDetail(tx)} 
                          className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:hover:bg-emerald-800 hover:bg-emerald-100 rounded-md transition-colors inline-flex" 
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 text-sm text-slate-500 dark:text-slate-400">
              <div>
                Đang hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} trên tổng số {filteredData.length} giao dịch.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Chi tiết Giao dịch
              </h2>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  {selectedItem.amount ? `${selectedItem.amount.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                </h3>
                <div className="flex flex-wrap gap-2 text-xs mb-4">
                  {selectedItem.status === 'paid' || selectedItem.status === 'thành công' || selectedItem.status === 'success' ? (
                    <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-semibold">Thành công</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-semibold">{selectedItem.status || 'Chưa rõ'}</span>
                  )}
                  <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-600">
                    {formatDate(selectedItem.createdAt || selectedItem.date || selectedItem.paidAt)}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-700 dark:text-slate-300 text-sm leading-relaxed border border-slate-100 dark:border-slate-700 space-y-2">
                <p><strong>Mã giao dịch / Hóa đơn:</strong> {selectedItem.transactionId || selectedItem.invoiceId || 'N/A'}</p>
                <p><strong>Người dùng:</strong> {selectedItem.userName || selectedItem.userEmail || selectedItem.userId || 'Ẩn danh'}</p>
                <p><strong>Ngày tạo:</strong> {formatDate(selectedItem.createdAt)}</p>
                {selectedItem.paidAt && <p><strong>Ngày thanh toán:</strong> {formatDate(selectedItem.paidAt)}</p>}
                {selectedItem.feeType && <p><strong>Loại phí:</strong> {selectedItem.feeType}</p>}
                {selectedItem.paymentMethod && <p><strong>Phương thức:</strong> {selectedItem.paymentMethod}</p>}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end bg-slate-50/50 dark:bg-slate-800/50">
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
    </div>
  );
}

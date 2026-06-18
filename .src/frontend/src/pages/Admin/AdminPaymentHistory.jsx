import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminTransactions } from '../../services/paymentService';
import { ROLES, normalizeRole } from '../../constants/roles';
import { RefreshCw, Search, ListFilter, Filter, Eye } from 'lucide-react';

export default function AdminPaymentHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

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
    return searchString.includes(searchKeyword.toLowerCase());
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
    <div className="min-h-screen bg-white py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Title Optional */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <Link to="/dashboard" className="hover:text-emerald-600 transition-colors">Bảng điều khiển</Link>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-emerald-600 font-semibold">Thanh toán</span>
            </nav>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">history</span>
              Lịch sử Giao dịch
            </h1>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
          
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
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Tìm theo mã, tên, email..." 
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
                />
              </div>


            </div>
          </div>

          {error && <div className="mb-4 text-rose-600 bg-rose-50 p-4 rounded-xl text-sm">{error}</div>}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-emerald-100">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#f0fdf4] border-b border-emerald-100">
                <tr>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 uppercase tracking-wider">Mã GD / Hóa đơn</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 uppercase tracking-wider">Người dùng</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 uppercase tracking-wider">Số tiền</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 uppercase tracking-wider">Trạng thái</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 uppercase tracking-wider">Ngày giờ</th>
                  <th className="py-4 px-5 text-xs font-bold text-emerald-600 uppercase tracking-wider text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400 text-sm">Đang tải dữ liệu...</td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400 text-sm">Không tìm thấy giao dịch nào phù hợp.</td>
                  </tr>
                ) : (
                  currentData.map((tx, idx) => (
                    <tr key={tx.id || idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-5 text-sm text-gray-800 font-medium">
                        {tx.transactionId || tx.invoiceId || 'N/A'}
                      </td>
                      <td className="py-4 px-5 text-sm text-gray-600">
                        {tx.userName || tx.userEmail || tx.userId || 'Ẩn danh'}
                      </td>
                      <td className="py-4 px-5 text-sm font-semibold text-emerald-600">
                        {tx.amount ? `${tx.amount.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                      </td>
                      <td className="py-4 px-5">
                        {tx.status === 'paid' || tx.status === 'thành công' || tx.status === 'success' ? (
                          <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center gap-1 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Thành công
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-1 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {tx.status || 'Chưa rõ'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-sm text-gray-600">
                        {formatDate(tx.createdAt || tx.date || tx.paidAt)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button 
                          onClick={() => handleOpenDetail(tx)} 
                          className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors inline-flex" 
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
            <div className="flex justify-between items-center mt-6 text-sm text-gray-500">
              <div>
                Đang hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} trên tổng số {filteredData.length} giao dịch.
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
                Chi tiết Giao dịch
              </h2>
              <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {selectedItem.amount ? `${selectedItem.amount.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                </h3>
                <div className="flex flex-wrap gap-2 text-xs mb-4">
                  {selectedItem.status === 'paid' || selectedItem.status === 'thành công' || selectedItem.status === 'success' ? (
                    <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 font-semibold">Thành công</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-rose-50 text-rose-600 font-semibold">{selectedItem.status || 'Chưa rõ'}</span>
                  )}
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">
                    {formatDate(selectedItem.createdAt || selectedItem.date || selectedItem.paidAt)}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-gray-700 text-sm leading-relaxed border border-gray-100 space-y-2">
                <p><strong>Mã giao dịch / Hóa đơn:</strong> {selectedItem.transactionId || selectedItem.invoiceId || 'N/A'}</p>
                <p><strong>Người dùng:</strong> {selectedItem.userName || selectedItem.userEmail || selectedItem.userId || 'Ẩn danh'}</p>
                <p><strong>Ngày tạo:</strong> {formatDate(selectedItem.createdAt)}</p>
                {selectedItem.paidAt && <p><strong>Ngày thanh toán:</strong> {formatDate(selectedItem.paidAt)}</p>}
                {selectedItem.feeType && <p><strong>Loại phí:</strong> {selectedItem.feeType}</p>}
                {selectedItem.paymentMethod && <p><strong>Phương thức:</strong> {selectedItem.paymentMethod}</p>}
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
    </div>
  );
}

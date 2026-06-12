import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminTransactions } from '../../services/paymentService';
import { ROLES, normalizeRole } from '../../constants/roles';

export default function AdminPaymentHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [roleFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminTransactions(roleFilter);
      // Giả sử res.data chứa danh sách giao dịch
      setTransactions(res.data || res || []);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải lịch sử giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (roleStr) => {
    const r = normalizeRole(roleStr);
    if (r === ROLES.ADMIN) return <span className="px-2 py-1 rounded bg-rose-100 text-rose-700 text-xs font-bold">Admin</span>;
    if (r === ROLES.MANAGER) return <span className="px-2 py-1 rounded bg-sky-100 text-sky-700 text-xs font-bold">Manager</span>;
    if (r === ROLES.COLLECTOR) return <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold">Collector</span>;
    return <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">Resident</span>;
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
              <span className="text-primary font-semibold">Thanh toán</span>
            </nav>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Lịch sử Giao dịch
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lọc theo vai trò:</div>
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="w-full md:w-64 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-white"
            >
              <option value="">Tất cả vai trò</option>
              <option value={ROLES.RESIDENT}>Cư dân (Resident)</option>
              <option value={ROLES.MANAGER}>Quản lý (Manager)</option>
              <option value={ROLES.COLLECTOR}>Nhân viên (Collector)</option>
              <option value={ROLES.ADMIN}>Quản trị viên (Admin)</option>
            </select>
          </div>

          {error && <div className="mb-4 text-rose-600 bg-rose-50 p-4 rounded-xl">{error}</div>}

          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Mã GD / Hóa đơn</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Người dùng</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Vai trò</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Số tiền</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold">Trạng thái</th>
                  <th className="py-4 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold text-right">Ngày giờ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">Đang tải dữ liệu...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">Không tìm thấy giao dịch nào.</td>
                  </tr>
                ) : (
                  transactions.map((tx, index) => (
                    <tr key={tx.id || index} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-5 text-sm text-slate-800 dark:text-white font-semibold">
                        {tx.transactionId || tx.invoiceId || 'N/A'}
                      </td>
                      <td className="py-4 px-5 text-sm text-slate-600 dark:text-slate-300">
                        {tx.userName || tx.userEmail || tx.userId || 'Ẩn danh'}
                      </td>
                      <td className="py-4 px-5">
                        {getRoleBadge(tx.userRole)}
                      </td>
                      <td className="py-4 px-5 text-sm font-semibold text-emerald-600">
                        {tx.amount ? `${tx.amount.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                      </td>
                      <td className="py-4 px-5">
                        {tx.status === 'paid' || tx.status === 'thành công' || tx.status === 'success' ? (
                          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">Thành công</span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-rose-100 text-rose-700 text-xs font-bold">{tx.status || 'Chưa rõ'}</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right text-xs text-slate-500">
                        {formatDate(tx.createdAt || tx.date || tx.paidAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

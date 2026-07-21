import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { ROLES, normalizeRole } from '../constants/roles';
import { createManagerInvoice, searchResidents, getResidentInvoices } from '../services/paymentService';

const buildErrorMessage = (error) => {
  if (!error) return 'Đã xảy ra lỗi.';
  if (typeof error === 'string') return error;
  return error.error || error.message || 'Đã xảy ra lỗi.';
};

const formatDateTime = (value) => {
  if (!value) return 'Chưa xác định';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDefaultInvoice = () => ({
  userId: '',
  invoiceId: '',
  amount: 0,
  billingMonth: new Date().getMonth() + 1,
  billingYear: new Date().getFullYear(),
  currency: 'VND',
  dueDate: '',
  feeType: 'monthly_sanitation_fee',
  status: 'unpaid',
  paidAt: '',
  createdAt: new Date().toISOString(),
  createdBy: '',
});

export default function ManagerInvoice() {
  const navigate = useNavigate();
  // Lấy user trực tiếp thay vì dùng useState + useEffect để tránh setState-in-effect
  const user = authService.getCurrentUser();
  
  const [invoice, setInvoice] = useState(() => {
    const defaults = getDefaultInvoice();
    return {
      ...defaults,
      createdBy: user ? (user.fullName || user.email || user.uid) : '',
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Resident search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Existing invoices for selected resident
  const [residentInvoices, setResidentInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Duplicate check
  const hasDuplicate = selectedResident && residentInvoices.some(
    (inv) => inv.status === 'unpaid'
      && Number(inv.billingMonth) === Number(invoice.billingMonth)
      && Number(inv.billingYear) === Number(invoice.billingYear)
  );

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const role = normalizeRole(user.role);
    if (role !== ROLES.MANAGER && role !== ROLES.ADMIN) {
      navigate('/dashboard');
    }
  }, [navigate, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced resident search
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);

    // If user clears the search, also clear selected resident
    if (!value.trim()) {
      setSearchResults([]);
      setSelectedResident(null);
      setResidentInvoices([]);
      setInvoice((prev) => ({ ...prev, userId: '' }));
      return;
    }

    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchResidents(value.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  // When a resident is selected from dropdown
  const handleSelectResident = useCallback(async (resident) => {
    setSelectedResident(resident);
    setSearchQuery(`${resident.fullName} (${resident.email})`);
    setShowDropdown(false);
    setSearchResults([]);

    // Set userId and auto-generate invoiceId
    setInvoice((prev) => {
      const updated = { ...prev, userId: resident.uid };
      if (!updated.invoiceId || updated.invoiceId.startsWith('invoice_')) {
        updated.invoiceId = `invoice_${resident.uid}_${updated.billingYear}_${String(updated.billingMonth).padStart(2, '0')}`;
      }
      return updated;
    });

    // Fetch existing invoices for this resident
    setInvoicesLoading(true);
    try {
      const invoices = await getResidentInvoices(resident.uid);
      setResidentInvoices(invoices);
    } catch {
      setResidentInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInvoice((prev) => {
      const updated = { ...prev, [name]: value };
      // Tự động tạo invoiceId khi userId, billingMonth, hoặc billingYear thay đổi
      if ((name === 'userId' || name === 'billingMonth' || name === 'billingYear') && updated.userId) {
        if (!updated.invoiceId || updated.invoiceId.startsWith('invoice_')) {
          updated.invoiceId = `invoice_${updated.userId}_${updated.billingYear}_${String(updated.billingMonth).padStart(2, '0')}`;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (hasDuplicate) {
      setError(`Cư dân này đã có hóa đơn chưa thanh toán cho tháng ${invoice.billingMonth}/${invoice.billingYear}. Không thể tạo thêm.`);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...invoice,
        amount: Number(invoice.amount),
        billingMonth: Number(invoice.billingMonth),
        billingYear: Number(invoice.billingYear),
        createdAt: invoice.createdAt || new Date().toISOString(),
        createdBy: invoice.createdBy,
        paidAt: invoice.status === 'paid' ? (invoice.paidAt || new Date().toISOString()) : null,
      };

      if (!payload.invoiceId || !payload.userId || !payload.amount || !payload.currency || !payload.dueDate || !payload.feeType) {
        throw new Error('Vui lòng điền đầy đủ các trường bắt buộc.');
      }

      const created = await createManagerInvoice(payload);
      setInvoice((prev) => ({ ...prev, ...created }));
      setSuccess('Hóa đơn đã được tạo thành công.');

      // Refresh resident invoices
      if (selectedResident) {
        try {
          const invoices = await getResidentInvoices(selectedResident.uid);
          setResidentInvoices(invoices);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setError(buildErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="max-w-container-max-width mx-auto px-margin-desktop py-8">
      <section className="mb-8">
        <nav className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-2">
          <Link to="/dashboard">Trang quản lý</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-semibold">Tạo hóa đơn</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Tạo hóa đơn cho cư dân</h1>
            <p className="text-sm text-on-surface-variant mt-2">Tìm kiếm cư dân theo tên hoặc email, xem hóa đơn hiện tại trước khi tạo mới.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
            >
              Quay lại dashboard
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-2 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {/* Resident Search Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">person_search</span>
                Tìm kiếm cư dân
              </span>
            </label>
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <input
                  id="resident-search"
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="Nhập tên hoặc email cư dân..."
                  autoComplete="off"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                {searchLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></span>
                  </span>
                )}
              </div>

              {/* Dropdown results */}
              {showDropdown && searchQuery.trim() && (
                <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {searchLoading ? (
                    <div className="px-4 py-3 text-sm text-slate-500">Đang tìm kiếm...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">Không tìm thấy cư dân nào phù hợp.</div>
                  ) : (
                    searchResults.map((resident) => (
                      <button
                        key={resident.uid}
                        type="button"
                        onClick={() => handleSelectResident(resident)}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-600 last:border-b-0 flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">person</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{resident.fullName || 'Chưa có tên'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{resident.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected resident badge */}
            {selectedResident && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-700 dark:text-emerald-300 text-[16px]">check</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{selectedResident.fullName}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{selectedResident.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResident(null);
                    setSearchQuery('');
                    setResidentInvoices([]);
                    setInvoice((prev) => ({ ...prev, userId: '' }));
                  }}
                  className="text-emerald-500 hover:text-emerald-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}
          </div>

          {/* Duplicate warning */}
          {hasDuplicate && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-900/30 p-4">
              <span className="material-symbols-outlined text-amber-600 text-[22px] mt-0.5">warning</span>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Không thể tạo hóa đơn trùng lặp</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Cư dân <strong>{selectedResident?.fullName}</strong> đã có hóa đơn chưa thanh toán cho tháng {invoice.billingMonth}/{invoice.billingYear}. Vui lòng chọn kỳ thanh toán khác hoặc chờ hóa đơn hiện tại được thanh toán.
                </p>
              </div>
            </div>
          )}

          {/* Existing invoices for the selected resident */}
          {selectedResident && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">receipt_long</span>
                Hóa đơn hiện có của {selectedResident.fullName}
              </h3>
              {invoicesLoading ? (
                <div className="text-sm text-slate-500 py-2">Đang tải hóa đơn...</div>
              ) : residentInvoices.length === 0 ? (
                <div className="text-sm text-slate-500 py-2 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                  Chưa có hóa đơn nào.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="text-left px-4 py-2 text-slate-600 dark:text-slate-300 font-medium">Kỳ</th>
                        <th className="text-left px-4 py-2 text-slate-600 dark:text-slate-300 font-medium">Số tiền</th>
                        <th className="text-left px-4 py-2 text-slate-600 dark:text-slate-300 font-medium">Trạng thái</th>
                        <th className="text-left px-4 py-2 text-slate-600 dark:text-slate-300 font-medium">Hạn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residentInvoices.map((inv) => (
                        <tr key={inv.invoiceId || inv.id} className="border-t border-slate-100 dark:border-slate-700">
                          <td className="px-4 py-2.5 text-slate-800 dark:text-white">
                            Tháng {inv.billingMonth}/{inv.billingYear}
                          </td>
                          <td className="px-4 py-2.5 text-slate-800 dark:text-white">
                            {Number(inv.amount)?.toLocaleString('vi-VN')} {inv.currency}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'}`}>
                              {inv.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                            {formatDateTime(inv.dueDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">Mã hóa đơn</span>
              <input
                name="invoiceId"
                value={invoice.invoiceId}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="invoice_resident_123_2026_06"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">Số tiền</span>
              <input
                type="number"
                name="amount"
                min="0"
                value={invoice.amount}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">Loại phí</span>
              <input
                name="feeType"
                value={invoice.feeType}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">Tháng</span>
              <input
                type="number"
                name="billingMonth"
                min="1"
                max="12"
                value={invoice.billingMonth}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">Năm</span>
              <input
                type="number"
                name="billingYear"
                min="2024"
                value={invoice.billingYear}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">Đơn vị tiền</span>
              <input
                name="currency"
                value={invoice.currency}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">Hạn thanh toán</span>
              <input
                type="date"
                name="dueDate"
                value={invoice.dueDate}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">Trạng thái</span>
              <select
                name="status"
                value={invoice.status}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="unpaid">Chưa thanh toán</option>
                <option value="paid">Đã thanh toán</option>
              </select>
            </label>
            {invoice.status === 'paid' && (
              <label className="block">
                <span className="text-sm text-slate-600 dark:text-slate-300">Ngày thanh toán</span>
                <input
                  type="datetime-local"
                  name="paidAt"
                  value={invoice.paidAt}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={loading || hasDuplicate || !selectedResident}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang lưu...' : hasDuplicate ? 'Không thể tạo – trùng lặp' : 'Tạo hóa đơn'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Hủy
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-on-surface mb-4">Thông tin hóa đơn</h2>
          <div className="grid gap-4 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Cư dân</p>
              <p>{selectedResident ? `${selectedResident.fullName} (${selectedResident.email})` : 'Chưa chọn cư dân'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Người tạo</p>
              <p>{invoice.createdBy}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Ngày tạo</p>
              <p>{formatDateTime(invoice.createdAt)}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Lưu ý</p>
              <p>Hóa đơn sẽ được lưu vào hệ thống và có thể được thanh toán bởi cư dân thông qua trang thanh toán của họ.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

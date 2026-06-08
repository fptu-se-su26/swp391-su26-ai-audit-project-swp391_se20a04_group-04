import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { ROLES, normalizeRole } from '../constants/roles';
import { createManagerInvoice } from '../services/paymentService';

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
  const [user, setUser] = useState(null);
  const [invoice, setInvoice] = useState(getDefaultInvoice());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const role = normalizeRole(currentUser.role);
    if (role !== ROLES.MANAGER) {
      navigate('/dashboard');
      return;
    }

    setUser(currentUser);
    setInvoice((prev) => ({
      ...prev,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.fullName || currentUser.email || currentUser.uid,
    }));
  }, [navigate]);

  useEffect(() => {
    if (!invoice.userId) return;
    if (!invoice.invoiceId || invoice.invoiceId.startsWith('invoice_')) {
      setInvoice((prev) => ({
        ...prev,
        invoiceId: `invoice_${prev.userId}_${prev.billingYear}_${String(prev.billingMonth).padStart(2, '0')}`,
      }));
    }
  }, [invoice.userId, invoice.billingMonth, invoice.billingYear]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
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
            <p className="text-sm text-on-surface-variant mt-2">Tạo và xem trước hóa đơn mới trước khi gửi cho cư dân.</p>
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
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">ID cư dân</span>
              <input
                name="userId"
                value={invoice.userId}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="uid resident_123"
              />
            </label>
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
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang lưu...' : 'Tạo hóa đơn'}
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

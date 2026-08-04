import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { ROLES, normalizeRole } from '../constants/roles';
import { createManagerInvoice, getResidentAreas, getInvoiceTemplates, createInvoiceTemplate, deleteInvoiceTemplate } from '../services/paymentService';

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

  // Area-based states
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');

  // Template state
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const role = normalizeRole(user.role);
    if (role !== ROLES.MANAGER && role !== ROLES.ADMIN) {
      navigate('/dashboard');
      return;
    }

    // Load templates and resident areas on mount
    getInvoiceTemplates().then(setTemplates).catch(() => {});
    getResidentAreas().then(setAreas).catch(() => {});
  }, [navigate, user]);


  const handleChange = (event) => {
    const { name, value } = event.target;
    setInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedArea.trim()) {
      setError('Vui lòng nhập hoặc chọn khu vực áp dụng.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        area: selectedArea.trim(),
        amount: Number(invoice.amount),
        billingMonth: Number(invoice.billingMonth),
        billingYear: Number(invoice.billingYear),
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        feeType: invoice.feeType,
        createdBy: invoice.createdBy,
      };

      if (!payload.amount || !payload.currency || !payload.dueDate || !payload.feeType) {
        throw new Error('Vui lòng điền đầy đủ các trường bắt buộc.');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(payload.dueDate) < today) {
        throw new Error('Hạn thanh toán không được là ngày trong quá khứ.');
      }

      const created = await createManagerInvoice(payload);
      setSuccess(`Đã tạo thành công ${created.count} hóa đơn cho cư dân thuộc khu vực "${selectedArea}".`);

      // Save as template if requested
      if (saveAsTemplate && templateName.trim()) {
        try {
          await createInvoiceTemplate({
            name: templateName.trim(),
            feeType: payload.feeType,
            amount: payload.amount,
            currency: payload.currency,
            dueOffsetDays: payload.dueDate ? Math.round((new Date(payload.dueDate) - new Date()) / 86400000) : 30,
          });
          setTemplates(prev => [...prev]);
          setTemplateName('');
          setSaveAsTemplate(false);
        } catch {
          // Template save failure is non-critical
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
          <span className="text-primary font-semibold">Tạo hóa đơn khu vực</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Tạo hóa đơn theo khu vực</h1>
            <p className="text-sm text-on-surface-variant mt-2">Chọn hoặc nhập tên khu vực để tự động phát hành hóa đơn hàng loạt cho cư dân.</p>
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
          {/* Section: Select Area */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">map</span>
                Khu vực áp dụng
              </span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">-- Chọn khu vực hiện có --</option>
                  {areas.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="text"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  placeholder="Hoặc nhập từ khóa tự do (vd: Thọ Quang)..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
            {selectedArea && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-sm text-primary">info</span>
                Hóa đơn sẽ được tạo tự động cho toàn bộ cư dân thuộc khu vực có tên chứa từ khóa <strong>"{selectedArea}"</strong>.
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
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
                min={new Date().toISOString().split('T')[0]}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={loading || !selectedArea.trim()}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang tạo...' : 'Tạo hóa đơn hàng loạt'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Hủy
            </button>
          </div>

          {/* Save as template option */}
          <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={e => setSaveAsTemplate(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
              Lưu hóa đơn này làm mẫu để tái sử dụng
            </label>
            {saveAsTemplate && (
              <input
                type="text"
                placeholder="Tên mẫu (vd: Phí vệ sinh tháng thường)"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm"
              />
            )}
          </div>

          {/* Templates panel */}
          <div className="mt-5">
            <button
              type="button"
              onClick={async () => {
                setShowTemplates(v => !v);
                if (!showTemplates) {
                  setTemplateLoading(true);
                  try { setTemplates(await getInvoiceTemplates()); } catch { /* ignore */ }
                  setTemplateLoading(false);
                }
              }}
              className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-500"
            >
              <span className="material-symbols-outlined text-base">library_books</span>
              {showTemplates ? 'Ẩn danh sách mẫu' : 'Dùng mẫu hóa đơn có sẵn'}
            </button>

            {showTemplates && (
              <div className="mt-3 space-y-2">
                {templateLoading ? (
                  <p className="text-sm text-slate-400">Đang tải...</p>
                ) : templates.length === 0 ? (
                  <p className="text-sm text-slate-400">Chưa có mẫu nào. Tạo hóa đơn và chọn "Lưu làm mẫu" để bắt đầu.</p>
                ) : templates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{t.name}</p>
                      <p className="text-slate-500 text-xs">{t.feeType} · {Number(t.amount).toLocaleString('vi-VN')} {t.currency} · Hạn sau {t.dueOffsetDays} ngày</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const dueDate = new Date();
                          dueDate.setDate(dueDate.getDate() + Number(t.dueOffsetDays || 30));
                          setInvoice(prev => ({
                            ...prev,
                            feeType: t.feeType,
                            amount: t.amount,
                            currency: t.currency,
                            dueDate: dueDate.toISOString().slice(0, 10),
                          }));
                          setShowTemplates(false);
                        }}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-100"
                      >
                        Dùng
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteInvoiceTemplate(t.id).catch(() => {});
                          setTemplates(prev => prev.filter(x => x.id !== t.id));
                        }}
                        className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold hover:bg-rose-100"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-on-surface mb-4">Thông tin hóa đơn</h2>
          <div className="grid gap-4 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Khu vực áp dụng</p>
              <p>{selectedArea ? selectedArea : 'Chưa chọn khu vực'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Người tạo</p>
              <p>{invoice.createdBy}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Ngày tạo</p>
              <p>{formatDateTime(invoice.createdAt)}</p>
            </div>
            {success && (
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Trạng thái</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Đã phát hành thành công
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Lưu ý</p>
              <p>Hệ thống tự động bỏ qua các cư dân đã có hóa đơn chưa thanh toán cùng kỳ (tháng/năm) trong khu vực chỉ định để tránh tạo hóa đơn trùng lặp.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

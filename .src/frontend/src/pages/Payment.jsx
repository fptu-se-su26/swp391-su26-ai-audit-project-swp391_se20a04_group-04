import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import { ROLES, normalizeRole } from '../constants/roles';
import {
  createInvoice,
  createPaymentRequest,
  fetchCurrentInvoice,
  fetchInvoiceHistory,
  verifyPaymentStatus,
  fetchMyInvoices,
} from '../services/paymentService';

// Removed AdminPaymentHistory for frontend
const SAMPLE_INVOICE_TEMPLATE = (userId) => ({
  invoiceId: `invoice_${userId}_2026_6`,
  amount: 50000,
  billingMonth: 6,
  billingYear: 2026,
  createdAt: '2026-06-01T00:00:00.000Z',
  createdBy: 'user_admin_001',
  currency: 'VND',
  dueDate: '2026-06-25T00:00:00.000Z',
  feeType: 'monthly_sanitation_fee',
  paidAt: null,
  status: 'unpaid',
  updatedAt: '2026-06-01T00:00:00.000Z',
  userId,
});

const formatDate = (value) => {
  if (!value) return 'Chưa xác định';
  const date = new Date(value);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const buildErrorMessage = (error) => {
  if (!error) return 'Đã xảy ra lỗi.';
  if (typeof error === 'string') return error;
  return error.error || error.message || 'Đã xảy ra lỗi.';
};

export default function Payment() {
  const currentUser = authService.getCurrentUser();
  const [invoice, setInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('payos');
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  // Khởi tạo loading dựa trên sự hiện diện của user để tránh setState trong useEffect
  const [loading, setLoading] = useState(!!currentUser);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [myInvoices, setMyInvoices] = useState([]);
  const historyRef = useRef(null);

  // Khai báo trước useEffect để tránh Temporal Dead Zone
  const createDefaultInvoice = async () => {
    if (!currentUser) {
      setError('Vui lòng đăng nhập trước khi thanh toán.');
      return;
    }

    try {
      const invoiceData = SAMPLE_INVOICE_TEMPLATE(currentUser.uid);
      const created = await createInvoice(invoiceData);
      setInvoice(created);
      setMyInvoices([created]);
      setPaymentStatus(created.status || 'unpaid');
      setSuccess('Hóa đơn mẫu đã được tạo. Bạn có thể tiếp tục thanh toán.');
    } catch (err) {
      setError(buildErrorMessage(err));
    }
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const role = normalizeRole(currentUser.role);
    if (role !== ROLES.RESIDENT) {
      // Không gọi setError trong useEffect; hiển thị thông báo trong render
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const invoicesList = await fetchMyInvoices();
        setMyInvoices(invoicesList);

        // Lọc hóa đơn chưa thanh toán / quá hạn
        const unpaidList = invoicesList.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue');
        const activeInvoice = unpaidList.length > 0 ? unpaidList[unpaidList.length - 1] : (invoicesList.length > 0 ? invoicesList[0] : null);

        setInvoice(activeInvoice);
        if (activeInvoice) {
          setPaymentStatus(activeInvoice.status || 'unpaid');
          if (activeInvoice.paymentUrl && activeInvoice.status !== 'paid') {
            setPaymentRequest({
              paymentUrl: activeInvoice.paymentUrl,
              qrCode: activeInvoice.qrCode || null,
            });
          }
        } else {
          setPaymentRequest(null);
        }

        // Lịch sử giao dịch (hóa đơn đã thanh toán)
        const paidList = invoicesList.filter(inv => inv.status === 'paid');
        setHistory(paidList);

      } catch (err) {
        const message = buildErrorMessage(err);
        if (message.includes('Không tìm thấy')) {
          await createDefaultInvoice();
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, currentUser?.role]);

  const handleRequestPayment = async () => {
    if (!invoice) {
      setError('Không có hóa đơn để thanh toán.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const result = await createPaymentRequest(invoice.invoiceId, paymentMethod);
      setPaymentRequest(result);
    } catch (err) {
      setError(buildErrorMessage(err));
    }
  };

  const pollingRef = useRef(null);

  const handleVerifyPayment = async () => {
    if (!invoice) {
      setError('Không có hóa đơn để kiểm tra.');
      return;
    }

    setError('');
    setSuccess('');
    setPaymentStatus('checking');

    try {
      const result = await verifyPaymentStatus(invoice.invoiceId);
      setInvoice(result.invoice);
      setPaymentStatus(result.paid ? 'paid' : 'unpaid');
      if (result.paid) {
        setPaymentRequest(null);
        setSuccess('Thanh toán đã hoàn tất. Hóa đơn đã được cập nhật.');
        try {
          const hist = await fetchInvoiceHistory();
          setHistory(hist);
        } catch {
          // ignore
        }
        setTimeout(() => {
          historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      } else {
        setError('Thanh toán chưa hoàn tất. Vui lòng quét QR và thử lại sau.');
      }
    } catch (err) {
      setPaymentStatus('unpaid');
      setError(buildErrorMessage(err));
    }
  };

  // Auto-polling: check payment status every 3 seconds when QR is active
  useEffect(() => {
    const shouldPoll = paymentRequest?.paymentUrl && invoice?.status !== 'paid';

    if (!shouldPoll || !invoice?.invoiceId) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const result = await verifyPaymentStatus(invoice.invoiceId);
        if (result.paid) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setInvoice(result.invoice);
          setPaymentStatus('paid');
          setPaymentRequest(null);
          setSuccess('Thanh toán đã hoàn tất. Hóa đơn đã được cập nhật.');
          setError('');
          try {
            const hist = await fetchInvoiceHistory();
            setHistory(hist);
          } catch {
            // ignore
          }
          setTimeout(() => {
            historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }
      } catch {
        // Silent polling fail
      }
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentRequest?.paymentUrl, invoice?.invoiceId, invoice?.status]);

  // Removed Admin check for regular frontend

  // Kiểm tra quyền non-resident trong render, không dùng useState trong useEffect
  if (currentUser && normalizeRole(currentUser.role) !== ROLES.RESIDENT) {
    return (
      <main className="max-w-container-max-width mx-auto px-margin-desktop py-8">
        <div className="rounded-xl border border-surface-container p-8 text-center bg-surface-container-lowest">
          <p className="font-body-md text-on-surface">Chỉ cư dân mới được phép truy cập và thanh toán hóa đơn.</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {

    return (
      <main className="max-w-container-max-width mx-auto px-margin-desktop py-8">
        <section className="mb-8">
          <nav className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-2">
            <Link to="/">Trang chủ</Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary font-semibold">Thanh toán</span>
          </nav>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Thanh toán phí vệ sinh môi trường</h1>
        </section>
        <div className="rounded-xl border border-surface-container p-8 text-center bg-surface-container-lowest">
          <p className="font-body-md text-on-surface">Bạn cần đăng nhập để xem và thanh toán hóa đơn.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex px-8 py-3 rounded-full bg-primary text-on-primary font-semibold"
          >
            Đến trang đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-container-max-width mx-auto px-margin-desktop py-8">
        <p className="text-on-surface">Đang tải hóa đơn...</p>
      </main>
    );
  }

  const unpaidInvoices = myInvoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue');
  const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const getNextDueDate = () => {
    if (unpaidInvoices.length > 0) {
      const dates = unpaidInvoices.map(inv => new Date(inv.dueDate)).filter(d => !isNaN(d.getTime()));
      if (dates.length > 0) {
        return new Date(Math.min(...dates));
      }
    }
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(25);
    return nextMonth;
  };
  const nextDueDate = getNextDueDate();

  const getFeeTypeLabel = (feeType, month, year) => {
    if (feeType === 'monthly_sanitation_fee') {
      return `Phí vệ sinh môi trường & thu gom rác thải sinh hoạt (Tháng ${month}/${year})`;
    }
    return feeType || 'Phí vệ sinh môi trường';
  };

  const getInvoiceDescriptionDetails = (feeType) => {
    if (feeType === 'monthly_sanitation_fee') {
      return 'Dịch vụ thu gom, vận chuyển và xử lý chất thải sinh hoạt định kỳ hộ gia đình; duy trì vệ sinh ngõ hẻm sạch đẹp và bảo vệ cảnh quan môi trường tại địa bàn Quận.';
    }
    return 'Phí dịch vụ vệ sinh và xử lý chất thải sinh hoạt định kỳ.';
  };

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 animate-fade-in">

      {/* Navigation Breadcrumbs */}
      <section className="mb-8">
        <nav className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-2">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-emerald-600 font-semibold">Thanh toán</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Thanh toán phí vệ sinh</h1>
      </section>

      {/* API Success & Error Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-sm">
          {success}
        </div>
      )}

      {/* Bill Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Tổng dư nợ chưa đóng</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {totalOutstanding.toLocaleString('vi-VN')}đ
          </p>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-amber-500">info</span>
            {unpaidInvoices.length} hóa đơn chưa thanh toán
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Hạn thanh toán kế tiếp</p>
          <p className="text-lg font-bold text-slate-950 dark:text-white mt-1">
            {nextDueDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">calendar_today</span>
            Định kỳ ngày 25 hàng tháng
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Tình trạng tài khoản</p>
          <p className={`text-lg font-extrabold mt-1 inline-flex items-center gap-1 ${totalOutstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            <span className="material-symbols-outlined text-xl">
              {totalOutstanding > 0 ? 'warning' : 'check_circle'}
            </span>
            {totalOutstanding > 0 ? 'Cần đóng phí' : 'Đã đóng đủ phí'}
          </p>
          <p className="text-xs text-slate-500 mt-3">Tài khoản Cư dân của {currentUser.fullName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Area: Unpaid invoices and PayOS Payment Details (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Unpaid Invoices list */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Hóa đơn cần thanh toán</h2>

            {unpaidInvoices.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="material-symbols-outlined text-emerald-600 text-5xl mb-2">celebrate</span>
                <p className="font-semibold text-slate-850 dark:text-white text-base">Tuyệt vời! Bạn không có hóa đơn nào chưa thanh toán.</p>
                <p className="text-xs text-slate-500 mt-1">Cảm ơn bạn đã đồng hành giữ gìn vệ sinh thành phố sạch đẹp.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unpaidInvoices.map((inv) => {
                  const isActive = invoice?.invoiceId === inv.invoiceId;
                  return (
                    <div
                      key={inv.invoiceId}
                      className={`p-5 rounded-2xl border transition-all ${isActive
                        ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10'
                        : 'border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30'
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${inv.status === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {inv.status === 'overdue' ? 'Quá hạn đóng' : 'Chưa thanh toán'}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {getFeeTypeLabel(inv.feeType, inv.billingMonth, inv.billingYear)}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Hạn thanh toán: <span className="font-semibold">{formatDate(inv.dueDate)}</span>
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic max-w-[450px]">
                            Nội dung hóa đơn: {getInvoiceDescriptionDetails(inv.feeType)}
                          </p>
                        </div>
                        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto mt-2 sm:mt-0 gap-3 border-t sm:border-0 pt-3 sm:pt-0">
                          <div>
                            <p className="text-[10px] text-slate-400">Số tiền</p>
                            <p className="font-bold text-emerald-600 text-base">{inv.amount?.toLocaleString('vi-VN')}đ</p>
                          </div>
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setInvoice(inv);
                                setPaymentStatus(inv.status);
                                if (inv.paymentUrl) {
                                  setPaymentRequest({
                                    paymentUrl: inv.paymentUrl,
                                    qrCode: inv.qrCode || null,
                                  });
                                } else {
                                  setPaymentRequest(null);
                                }
                              }}
                              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl transition-all"
                            >
                              Chọn thanh toán
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Method & QR code section (only shown if a bill is selected) */}
          {invoice && invoice.status !== 'paid' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-600">payments</span>
                  Thanh toán hóa đơn đang chọn
                </h3>
                <p className="text-xs text-slate-500 mt-1">Đang chọn: <strong>{getFeeTypeLabel(invoice.feeType, invoice.billingMonth, invoice.billingYear)}</strong></p>
              </div>

              {/* PayOS configuration info */}
              <div className="flex items-center p-4 rounded-xl border border-emerald-200/60 bg-emerald-50/20 dark:bg-emerald-950/20">
                <span className="material-symbols-outlined mr-4 text-emerald-600 text-3xl">qr_code_2</span>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-250 text-sm">Thanh toán qua PayOS (Quét mã VietQR)</p>
                  <p className="text-xs text-slate-500 mt-1">Hỗ trợ các app ngân hàng (MB Bank, VCB, BIDV, MoMo, VNPay...)</p>
                </div>
              </div>

              {!paymentRequest?.paymentUrl && (
                <button
                  type="button"
                  onClick={handleRequestPayment}
                  className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 active:scale-95"
                >
                  <span>Tạo mã QR thanh toán</span>
                  <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                </button>
              )}

              {paymentRequest?.paymentUrl && (
                <div className="flex flex-col items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="w-full rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      </div>
                      <div>
                        <p className="text-slate-400">Nội dung chuyển khoản</p>
                        <p className="font-bold text-slate-800 dark:text-white">Thanh toan phi ve sinh</p>
                        <p className="text-[10px] text-slate-400 break-all">{invoice.invoiceId}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-slate-400">Số tiền cần đóng</p>
                      <p className="font-extrabold text-emerald-600 text-base">{invoice.amount?.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>

                  {paymentRequest.qrCode ? (
                    <>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentRequest.qrCode)}`}
                        alt="QR VietQR Pro"
                        className="w-60 h-60 rounded-2xl bg-white p-4 border border-slate-100"
                      />
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                        <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Quét được bằng mọi ứng dụng Ngân hàng & MoMo</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentRequest.paymentUrl)}`}
                        alt="QR PayOS Link"
                        className="w-60 h-60 rounded-2xl bg-white p-4 border border-slate-100"
                      />
                    </>
                  )}

                  <div className="flex flex-col items-center gap-3">
                    <p className="text-center text-slate-500 text-xs">Hoặc mở liên kết thanh toán an toàn:</p>
                    <a
                      href={paymentRequest.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Mở trang thanh toán PayOS
                    </a>

                    <div className="mt-2 flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Hệ thống đang tự động kiểm tra trạng thái mỗi 3 giây...</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyPayment}
                      className="mt-2 inline-flex px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      Kiểm tra thủ công
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Area: Transaction History grouped by month (4 cols) */}
        <div className="lg:col-span-4" ref={historyRef}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm sticky top-24 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lịch sử thanh toán</h3>
              <span className="material-symbols-outlined text-emerald-600">history</span>
            </div>

            {history.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-6">Chưa có giao dịch thanh toán thành công nào.</p>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {history.map((inv) => (
                  <div
                    key={inv.invoiceId}
                    className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-2 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-850 dark:text-white text-xs">Thanh toán Tháng {inv.billingMonth}/{inv.billingYear}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 break-all">Mã: {inv.invoiceId}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                        <span className="material-symbols-outlined text-[10px] font-extrabold">check</span>
                        Thành công
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                      <span>{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('vi-VN') : 'Đã thanh toán'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{inv.amount?.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}


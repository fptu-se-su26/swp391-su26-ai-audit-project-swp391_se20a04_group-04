import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import {
  createInvoice,
  createPaymentRequest,
  fetchCurrentInvoice,
  verifyPaymentStatus,
} from '../services/paymentService';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const existingInvoice = await fetchCurrentInvoice();
        setInvoice(existingInvoice);
        setPaymentStatus(existingInvoice.status || 'unpaid');
        if (existingInvoice?.paymentUrl) {
          setPaymentRequest({
            paymentUrl: existingInvoice.paymentUrl,
            qrCode: existingInvoice.qrCode || null,
          });
        }
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
  }, [currentUser]);

  const createDefaultInvoice = async () => {
    if (!currentUser) {
      setError('Vui lòng đăng nhập trước khi thanh toán.');
      return;
    }

    try {
      const invoiceData = SAMPLE_INVOICE_TEMPLATE(currentUser.uid);
      const created = await createInvoice(invoiceData);
      setInvoice(created);
      setPaymentStatus(created.status || 'unpaid');
      setSuccess('Hóa đơn mẫu đã được tạo. Bạn có thể tiếp tục thanh toán.');
    } catch (err) {
      setError(buildErrorMessage(err));
    }
  };

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
      } else {
        setError('Thanh toán chưa hoàn tất. Vui lòng quét QR và thử lại sau.');
      }
    } catch (err) {
      setPaymentStatus('unpaid');
      setError(buildErrorMessage(err));
    }
  };

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

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-8 card-shadow border border-surface-container">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="font-headline-md text-headline-md mb-1 text-on-surface">Hóa đơn hiện tại</h2>
                <p className="text-on-surface-variant">
                  Kỳ thanh toán: <span className="font-semibold text-on-surface">Tháng {invoice?.billingMonth}/{invoice?.billingYear}</span>
                </p>
              </div>
              <span
                className={`px-4 py-1 rounded-full font-label-md text-label-md ${invoice?.status === 'paid' ? 'bg-emerald-200 text-emerald-800' : 'bg-error-container text-on-error-container'}`}
              >
                {invoice?.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 border-t border-b border-surface-container py-6 mb-6">
              <div className="md:col-span-2">
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Mã hóa đơn</p>
                <p className="font-body-md font-semibold text-on-surface break-all">{invoice?.invoiceId}</p>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Người tạo</p>
                <p className="font-body-md font-semibold text-on-surface">{invoice?.createdBy}</p>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Hạn thanh toán</p>
                <p className="font-body-md text-on-surface">{formatDate(invoice?.dueDate)}</p>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Loại phí</p>
                <p className="font-body-md text-on-surface">{invoice?.feeType}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-label-sm text-on-surface-variant">Tổng tiền</p>
                <p className="font-headline-md text-headline-md text-primary">{invoice?.amount?.toLocaleString('vi-VN')} {invoice?.currency}</p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Ngày tạo</p>
                <p className="font-body-md text-on-surface">{formatDate(invoice?.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-8 card-shadow border border-surface-container">
            <h3 className="font-headline-md text-headline-md mb-6 text-on-surface">Chọn phương thức thanh toán</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`relative flex items-center p-4 rounded-lg border cursor-pointer hover:bg-surface-container-low transition-colors ${paymentMethod === 'credit_card' ? 'border-primary bg-surface-container-low' : 'border-surface-container-high'}`}>
                <input
                  className="hidden"
                  name="payment"
                  type="radio"
                  value="credit_card"
                  checked={paymentMethod === 'credit_card'}
                  onChange={() => setPaymentMethod('credit_card')}
                />
                <span className="material-symbols-outlined mr-4 text-primary">credit_card</span>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">Thẻ tín dụng / Ghi nợ</p>
                </div>
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {paymentMethod === 'credit_card' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </label>
              <label className={`relative flex items-center p-4 rounded-lg border cursor-pointer hover:bg-surface-container-low transition-colors ${paymentMethod === 'momo' ? 'border-primary bg-surface-container-low' : 'border-surface-container-high'}`}>
                <input
                  className="hidden"
                  name="payment"
                  type="radio"
                  value="momo"
                  checked={paymentMethod === 'momo'}
                  onChange={() => setPaymentMethod('momo')}
                />
                <span className="material-symbols-outlined mr-4 text-on-surface-variant">account_balance_wallet</span>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">Ví MoMo</p>
                </div>
                <span className="material-symbols-outlined text-outline-variant">
                  {paymentMethod === 'momo' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </label>
              <label className={`relative flex items-center p-4 rounded-lg border cursor-pointer hover:bg-surface-container-low transition-colors ${paymentMethod === 'payos' ? 'border-primary bg-surface-container-low' : 'border-surface-container-high'}`}>
                <input
                  className="hidden"
                  name="payment"
                  type="radio"
                  value="payos"
                  checked={paymentMethod === 'payos'}
                  onChange={() => setPaymentMethod('payos')}
                />
                <span className="material-symbols-outlined mr-4 text-on-surface-variant">qr_code_2</span>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">PayOS (quét QR)</p>
                </div>
                <span className="material-symbols-outlined text-outline-variant">
                  {paymentMethod === 'payos' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </label>
              <label className={`relative flex items-center p-4 rounded-lg border cursor-pointer hover:bg-surface-container-low transition-colors ${paymentMethod === 'bank_transfer' ? 'border-primary bg-surface-container-low' : 'border-surface-container-high'}`}>
                <input
                  className="hidden"
                  name="payment"
                  type="radio"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                />
                <span className="material-symbols-outlined mr-4 text-on-surface-variant">account_balance</span>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">Chuyển khoản ngân hàng</p>
                </div>
                <span className="material-symbols-outlined text-outline-variant">
                  {paymentMethod === 'bank_transfer' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleRequestPayment}
              className="mt-8 w-full md:w-auto px-10 py-4 bg-primary text-on-primary rounded-full font-headline-md text-headline-md active:scale-95 transition-transform flex items-center justify-center gap-2"
              disabled={invoice?.status === 'paid'}
            >
              <span>{invoice?.status === 'paid' ? 'Hóa đơn đã thanh toán' : 'Tạo mã QR và thanh toán'}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>

          {paymentRequest?.paymentUrl && (
            <div className="bg-surface-container-lowest rounded-xl p-8 card-shadow border border-surface-container">
              <h3 className="font-headline-md text-headline-md mb-6 text-on-surface">Quét mã QR để thanh toán</h3>
              <div className="flex flex-col items-center gap-6">

                {/* Thông tin thanh toán */}
                <div className="w-full rounded-xl bg-surface-container-low border border-surface-container p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-primary text-[20px]">receipt_long</span>
                    </div>
                    <div>
                      <p className="text-label-sm text-on-surface-variant">Nội dung chuyển khoản</p>
                      <p className="font-semibold text-on-surface text-sm">Thanh toan phi ve sinh</p>
                      <p className="text-xs text-on-surface-variant break-all">{invoice?.invoiceId}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-label-sm text-on-surface-variant">Số tiền</p>
                    <p className="font-headline-md text-headline-md text-primary">{invoice?.amount?.toLocaleString('vi-VN')} <span className="text-base">{invoice?.currency}</span></p>
                  </div>
                </div>

                {/* Ưu tiên dùng qrCode VietQR Pro (MoMo/MB Bank quét được) */}
                {paymentRequest.qrCode ? (
                  <>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(paymentRequest.qrCode)}`}
                      alt="QR VietQR Pro"
                      className="w-72 h-72 rounded-2xl bg-white p-4"
                    />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                      <p className="text-sm font-semibold text-emerald-700">VietQR Pro – Quét được bằng MoMo, MB Bank, VCB...</p>
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(paymentRequest.paymentUrl)}`}
                      alt="QR PayOS"
                      className="w-72 h-72 rounded-2xl bg-white p-4"
                    />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                      <span className="material-symbols-outlined text-amber-600 text-[18px]">info</span>
                      <p className="text-sm text-amber-700">Mã này chỉ dùng mở trên browser. Dùng nút bên dưới để thanh toán.</p>
                    </div>
                  </>
                )}

                <p className="text-center text-on-surface-variant text-sm">
                  Hoặc mở link thanh toán trực tiếp:
                </p>
                <a
                  href={paymentRequest.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-semibold text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  Mở trang thanh toán PayOS
                </a>

                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  className="mt-2 inline-flex px-8 py-3 rounded-full bg-secondary text-on-secondary font-semibold"
                >
                  Kiểm tra trạng thái thanh toán
                </button>
                {paymentStatus === 'checking' && <p className="text-on-surface-variant">Đang kiểm tra thanh toán...</p>}
                {invoice?.status === 'paid' && <p className="text-emerald-700">Hóa đơn đã được thanh toán vào {formatDate(invoice.paidAt)}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container-lowest rounded-xl p-8 card-shadow border border-surface-container sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Lịch sử giao dịch</h3>
              <span className="material-symbols-outlined text-primary">history</span>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Tháng 9/2024</p>
                    <p className="text-label-sm text-on-surface-variant">30.000 VNĐ</p>
                  </div>
                </div>
                <span className="text-primary font-label-sm font-semibold">Thành công</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Tháng 8/2024</p>
                    <p className="text-label-sm text-on-surface-variant">30.000 VNĐ</p>
                  </div>
                </div>
                <span className="text-primary font-label-sm font-semibold">Thành công</span>
              </div>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Tháng 7/2024</p>
                    <p className="text-label-sm text-on-surface-variant">30.000 VNĐ</p>
                  </div>
                </div>
                <span className="text-primary font-label-sm font-semibold">Thành công</span>
              </div>
            </div>
            <a
              className="mt-8 block text-center py-3 rounded-lg border-2 border-primary text-primary font-label-md text-label-md hover:bg-primary hover:text-on-primary transition-all"
              href="#"
            >
              Xem tất cả lịch sử
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email.trim());
      setSuccess('Đã gửi đường dẫn khôi phục mật khẩu. Vui lòng kiểm tra hộp thư đến (hoặc Spam) của bạn.');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container py-16 px-4 flex items-center justify-center min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
      <div className="login-card w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        
        {/* Top Accent Bar */}
        <div className="h-2 bg-emerald-600 w-full"></div>

        {/* Content Panel */}
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <span className="material-symbols-outlined text-2xl font-bold">
                key
              </span>
            </div>
            <h1 className="font-headline-md text-2xl font-bold text-slate-800 dark:text-white">
              Khôi phục mật khẩu
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 text-center">
              Nhập email bạn đã đăng ký. Hệ thống sẽ gửi một liên kết để thiết lập lại mật khẩu mới.
            </p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="alert alert-success bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 mb-6 flex flex-col items-center text-center gap-2 text-sm animate-fade-in">
              <span className="material-symbols-outlined text-3xl">mark_email_read</span>
              <span>{success}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="rounded-lg p-3 mb-5 flex items-start gap-2.5 text-xs animate-fade-in border bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900">
              <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">
                error
              </span>
              <div>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Địa chỉ Email
                </label>
                <div className="input-wrapper relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: admin@ecoschedule.vn"
                    className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border ${
                      error ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200'
                    } rounded-xl text-sm focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang gửi...
                  </>
                ) : (
                  <>Gửi liên kết khôi phục</>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
  // Check if user is logged in
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    navigate('/login');
    return;
  }

     setUser(currentUser);

  // Listen for auth change events
  const handleAuthChange = () => {
    setUser(authService.getCurrentUser());
  };

  window.addEventListener('authChange', handleAuthChange);

  return () => {
    window.removeEventListener('authChange', handleAuthChange);
  };

}, [navigate]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900 py-10 px-4 md:px-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4.5">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-3xl font-semibold">
                account_circle
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">{user.fullName || 'Người dùng'}</h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">mail</span> {user.email}
              </p>
              {user.phone && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">phone</span> {user.phone}
                </p>
              )}
              {user.address && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">home</span> {user.address} ({user.area})
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 self-stretch md:self-auto justify-center"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-1 bg-emerald-600 rounded-full"></span>
            <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Bảng điều khiển cá nhân
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Lịch thu gom */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">calendar_today</span>
                  Lịch thu gom tiếp theo tại {user.area || 'khu vực của bạn'}
                </h2>
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">
                  Định kỳ
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Rác thải hữu cơ (Rác sinh hoạt)</p>
                    <p className="text-xs text-slate-500 mt-0.5">Ngày mai, Khung giờ: 17:00 - 19:00</p>
                  </div>
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">eco</span>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Rác tái chế (Nhựa, kim loại)</p>
                    <p className="text-xs text-slate-500 mt-0.5">Chủ nhật hàng tuần, Khung giờ: 08:00 - 10:00</p>
                  </div>
                  <span className="material-symbols-outlined text-sky-600 text-2xl">recycle</span>
                </div>
              </div>
            </div>

            {/* Thông tin phí dịch vụ */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">payments</span>
                    Phí dịch vụ thu gom rác
                  </h2>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tháng này (Tháng 5/2026)</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">30.000đ</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold">
                    Chưa thanh toán
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/thanh-toan')}
                className="w-full mt-6 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-emerald-100 flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 animate-pulse-subtle"
              >
                <span>Thanh toán ngay</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { ROLES, normalizeRole } from '../../constants/roles';
import UserManagement from './UserManagement';
import AdminComplaints from './AdminComplaints';

export default function AdminManagement() {
  const navigate = useNavigate();
  const location = useLocation();

  // Tính toán trực tiếp từ URL thay vì dùng state, tránh setState trong useEffect
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') === 'complaints' ? 'complaints' : 'users';

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || normalizeRole(user.role) !== ROLES.ADMIN) {
      navigate('/');
    }
  }, [navigate]);

  const handleTabChange = (tab) => {
    navigate(`/quan-ly?tab=${tab}`, { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 py-8 px-4 md:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-200/50 dark:border-emerald-900/30 mb-3">
                <span className="material-symbols-outlined text-sm font-semibold">admin_panel_settings</span>
                Trang Quản Trị Hệ Thống
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                Quản lý chung
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-2xl">
                Tại đây bạn có thể quản lý thông tin tài khoản người dùng và theo dõi, xử lý các phản ánh từ cư dân.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shrink-0">
              <button
                onClick={() => handleTabChange('users')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === 'users'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">group</span>
                Người dùng
              </button>
              <button
                onClick={() => handleTabChange('complaints')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === 'complaints'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">rate_review</span>
                Phản ánh
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'users' && <UserManagement hideHeader={true} />}
          {activeTab === 'complaints' && <AdminComplaints hideHeader={true} />}
        </div>
        
      </div>
    </div>
  );
}

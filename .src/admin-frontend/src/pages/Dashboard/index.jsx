import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import managerReportService from '../../services/managerReportService';
import complaintService from '../../services/complaintService';
import { ROLES, normalizeRole } from '../../constants/roles';
import CollectionRouteMap from '../../components/CollectionRouteMap';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/auth', '')
  : 'http://localhost:5001';

const safeJson = async (response) => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
  } catch {
    // Ignore error
  }
  return {};
};

function getStatusBadge(status) {
  const state = (status || '').toLowerCase();
  if (state.includes('confirmed')) return 'bg-emerald-200 text-emerald-800';
  if (state.includes('assigned')) return 'bg-emerald-100 text-emerald-700';
  if (state.includes('planned')) return 'bg-sky-100 text-sky-700';
  if (state.includes('delayed')) return 'bg-amber-100 text-amber-700';
  if (state.includes('completed')) return 'bg-slate-100 text-slate-600';
  return 'bg-slate-100 text-slate-700';
}

function formatDate(dateString) {
  if (!dateString) return 'Chưa xác định';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  // Khởi tạo user trực tiếp để tránh setState-in-effect
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [managerLoading, setManagerLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [managerError, setManagerError] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [feedbackReports, setFeedbackReports] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [report, setReport] = useState(null);
  const [viewingIncident, setViewingIncident] = useState(null);

  // Complaint management state
  const [viewingComplaint, setViewingComplaint] = useState(null);
  const [complaintFilter, setComplaintFilter] = useState('all');
  const [complaintComment, setComplaintComment] = useState('');
  const [complaintActionLoading, setComplaintActionLoading] = useState(false);

  const [newSchedule, setNewSchedule] = useState({
    routeName: 'North Route A',
    serviceType: 'Recycling',
    date: new Date().toISOString().slice(0, 10),
    time: '08:00',
    city: 'Đà Nẵng',
    ward: 'Phường An Hải Tây',
    neighborhood: 'Tổ 12',
    assignedTruck: 'TRUCK-402',
    assignedDriver: 'Nguyễn Văn A',
    assignedCollector: '',
    notes: '',
  });

  const [assignment, setAssignment] = useState({
    scheduleId: '',
    assignedTruck: 'TRUCK-402',
    assignedDriver: 'Nguyễn Văn A',
    assignedCollector: 'Collector placeholder',
  });

  const [routePoints, setRoutePoints] = useState([
    [16.0628, 108.2232],
    [16.0685, 108.2197],
    [16.0752, 108.2253],
    [16.0818, 108.2322],
  ]);

  // Address selection state
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    // setUser được khởi tạo trực tiếp từ useState, không cần gọi lại ở đây
    // Chỉ lắng nghe sự kiện thay đổi auth để cập nhật khi logout/login
    const handleAuthChange = () => {
      setUser(authService.getCurrentUser());
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [navigate]);

  // Fetch address data
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch(`${API_BASE}/api/address/provinces`);
        if (res.ok) {
          const data = await res.json();
          setProvinces(data);
        }
      } catch (err) {
        console.error('Lỗi khi tải tỉnh thành:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  const handleProvinceChange = async (e) => {
    const newProvinceCode = e.target.value;
    setSelectedProvince(newProvinceCode);
    setSelectedWard('');
    setWards([]);

    const provinceObj = provinces.find(p => p.code.toString() === newProvinceCode.toString());
    setNewSchedule(prev => ({ ...prev, city: provinceObj ? provinceObj.name : '' }));

    if (!newProvinceCode) return;

    setLoadingWards(true);
    try {
      const res = await fetch(`${API_BASE}/api/address/wards?provinceCode=${newProvinceCode}`);
      if (res.ok) {
        const data = await res.json();
        setWards(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải phường xã:', err);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleWardChange = (e) => {
    const newWardCode = e.target.value;
    setSelectedWard(newWardCode);
    const wardObj = wards.find(w => w.code.toString() === newWardCode.toString());
    setNewSchedule(prev => ({ ...prev, ward: wardObj ? wardObj.name : '' }));
  };

  const getAuthHeaders = async () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await authService.getFreshToken()}`,
  });

  // Khai báo fetch functions TRƯỚC loadManagerData để tránh TDZ
  const fetchSchedules = async () => {
    const response = await fetch(`${API_BASE}/api/manager/schedules`, {
      headers: await getAuthHeaders(),
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải lịch thu gom.');
    setSchedules(data);
    if (data.length > 0) {
      const selectedId = assignment.scheduleId || data[0].id;
      const selectedSchedule = data.find((schedule) => schedule.id === selectedId);
      if (selectedSchedule) {
        setAssignment((prev) => ({
          ...prev,
          scheduleId: selectedId,
          assignedTruck: selectedSchedule.assigned_truck || '',
          assignedDriver: selectedSchedule.assigned_driver || '',
          assignedCollector: selectedSchedule.assigned_collector || '',
        }));
        setRoutePoints(selectedSchedule.route_points || []);
      }
    }
    return data;
  };

  const fetchComplaints = async () => {
    const data = await complaintService.getManagerComplaints();
    setComplaints(data);
    return data;
  };

  const handleComplaintAction = async (complaintId, status) => {
    if (status === 'rejected' && !complaintComment.trim()) {
      setManagerError('Vui lòng nhập lý do từ chối phản ánh.');
      return;
    }
    setComplaintActionLoading(true);
    setApiMessage('');
    setManagerError('');
    try {
      await complaintService.updateComplaintStatus(complaintId, status, complaintComment);
      const statusLabels = { in_resolve: 'Đang xử lý', resolved: 'Đã giải quyết', rejected: 'Đã từ chối' };
      setApiMessage(`Đã cập nhật phản ánh: ${statusLabels[status] || status}`);
      setViewingComplaint(null);
      setComplaintComment('');
      await fetchComplaints();
    } catch (error) {
      setManagerError(error.message || 'Không thể cập nhật phản ánh.');
    } finally {
      setComplaintActionLoading(false);
    }
  };

  const fetchFeedbackReports = async () => {
    const data = await managerReportService.listFeedbackReports();
    setFeedbackReports(data);
    return data;
  };

  const handleApproveReport = async (reportId) => {
    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');
    try {
      await managerReportService.approveReport(reportId, 'Đã kiểm tra và duyệt kết quả xử lý.');
      setApiMessage('Đã duyệt phản ánh. Cư dân sẽ nhận thông báo.');
      await fetchFeedbackReports();
    } catch (error) {
      setManagerError(error.message || 'Không thể duyệt phản ánh.');
    } finally {
      setManagerLoading(false);
    }
  };

  const fetchReport = async () => {
    const response = await fetch(`${API_BASE}/api/manager/reports`, {
      headers: await getAuthHeaders(),
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải báo cáo.');
    setReport(data);
    return data;
  };

  const fetchCollectors = async () => {
    const response = await fetch(`${API_BASE}/api/manager/collectors`, {
      headers: await getAuthHeaders(),
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data.error || 'Không thể tải danh sách nhân viên thu gom.');
    setCollectors(data);
    return data;
  };

  const loadManagerData = async () => {
    setManagerLoading(true);
    setManagerError('');
    try {
      await Promise.all([
        fetchSchedules(),
        fetchComplaints(),
        fetchReport(),
        fetchCollectors(),
        fetchFeedbackReports(),
      ]);
    } catch (error) {
      setManagerError(error.message || 'Không thể tải dữ liệu quản lý.');
    } finally {
      setManagerLoading(false);
    }
  };

  useEffect(() => {
    if (user === null) {
      return;
    }

    const role = normalizeRole(user.role);
    if (role === ROLES.RESIDENT) {
      navigate('/');
      return;
    }

    if (role === ROLES.MANAGER || role === ROLES.ADMIN) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadManagerData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const handleCreateSchedule = async (event) => {
    event.preventDefault();
    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');

    try {
      const response = await fetch(`${API_BASE}/api/manager/schedules`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          ...newSchedule,
          routePoints,
        }),
      });
      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || 'Không thể tạo lịch thu gom mới.');

      setApiMessage('Lịch thu gom mới đã được tạo thành công.');
      await fetchSchedules();
      if (data.schedule?.route_points) {
        setRoutePoints(data.schedule.route_points);
      }
    } catch (error) {
      setManagerError(error.message || 'Lỗi khi tạo lịch thu gom.');
    } finally {
      setManagerLoading(false);
    }
  };

  const handleSaveRoute = async () => {
    if (!assignment.scheduleId) {
      setManagerError('Vui lòng chọn một lịch để lưu tuyến.');
      return;
    }
    const selectedSchedule = schedules.find((schedule) => schedule.id === assignment.scheduleId);
    if (selectedSchedule?.collector_confirmed) {
      setManagerError('Tuyến đã được nhân viên xác nhận, không thể chỉnh sửa nữa.');
      return;
    }

    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');

    try {
      const response = await fetch(`${API_BASE}/api/manager/schedules/${assignment.scheduleId}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ routePoints }),
      });
      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || 'Không thể lưu tuyến.');

      setApiMessage('Tuyến đã được lưu thành công.');
      await fetchSchedules();
    } catch (error) {
      setManagerError(error.message || 'Lỗi khi lưu tuyến.');
    } finally {
      setManagerLoading(false);
    }
  };

  const handleAssignRoute = async (event) => {
    event.preventDefault();
    if (!assignment.scheduleId) {
      setManagerError('Vui lòng chọn một lịch thu gom để gán tuyến.');
      return;
    }
    const selectedSchedule = schedules.find((schedule) => schedule.id === assignment.scheduleId);
    if (selectedSchedule?.collector_confirmed) {
      setManagerError('Tuyến đã được nhân viên xác nhận, không thể chỉnh sửa nữa.');
      return;
    }

    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');

    try {
      const response = await fetch(`${API_BASE}/api/manager/assign-route`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          scheduleId: assignment.scheduleId,
          assignedTruck: assignment.assignedTruck,
          assignedDriver: assignment.assignedDriver,
          assignedCollector: assignment.assignedCollector,
        }),
      });
      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || 'Không thể gán tuyến.');

      setApiMessage('Gán tuyến thành công cho lịch thu gom.');
      await fetchSchedules();
    } catch (error) {
      setManagerError(error.message || 'Lỗi khi gán tuyến.');
    } finally {
      setManagerLoading(false);
    }
  };

  const handleConfirmRoute = async () => {
    if (!assignment.scheduleId) {
      setManagerError('Vui lòng chọn một lịch để xác nhận.');
      return;
    }

    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');

    try {
      const response = await fetch(`${API_BASE}/api/manager/confirm-route`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ scheduleId: assignment.scheduleId }),
      });
      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || 'Không thể xác nhận tuyến.');

      setApiMessage('Tuyến đã được xác nhận thành công.');
      await fetchSchedules();
    } catch (error) {
      setManagerError(error.message || 'Lỗi khi xác nhận tuyến.');
    } finally {
      setManagerLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const content = JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecoschedule-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteSchedule = async (scheduleId, routeName) => {
    if (!window.confirm(`Xóa lịch thu gom "${routeName || scheduleId}"?\nHành động này không thể hoàn tác.`)) return;

    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');
    try {
      const response = await fetch(`${API_BASE}/api/manager/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      });
      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || 'Không thể xóa lịch thu gom.');
      setApiMessage(data.message || 'Đã xóa lịch thu gom thành công.');
      // Clear assignment if the deleted schedule was selected
      setAssignment((prev) => prev.scheduleId === scheduleId
        ? { scheduleId: '', assignedTruck: '', assignedDriver: '', assignedCollector: '' }
        : prev);
      await fetchSchedules();
    } catch (error) {
      setManagerError(error.message || 'Lỗi khi xóa lịch thu gom.');
    } finally {
      setManagerLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const handleChangeNewSchedule = (event) => {
    const { name, value } = event.target;
    setNewSchedule((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeAssignment = (event) => {
    const { name, value } = event.target;

    if (name === 'scheduleId') {
      const selectedSchedule = schedules.find((schedule) => schedule.id === value);
      if (selectedSchedule) {
        setRoutePoints(selectedSchedule.route_points || []);
        setAssignment((prev) => ({
          ...prev,
          scheduleId: value,
          assignedTruck: selectedSchedule.assigned_truck || '',
          assignedDriver: selectedSchedule.assigned_driver || '',
          assignedCollector: selectedSchedule.assigned_collector || '',
        }));
        return;
      }
    }

    setAssignment((prev) => ({ ...prev, [name]: value }));
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900">
        <svg className="animate-spin h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  const isManager = normalizeRole(user.role) === ROLES.MANAGER || normalizeRole(user.role) === ROLES.ADMIN;

  if (!isManager) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900 py-10 px-4 md:px-8 animate-fade-in">
        <div className="max-w-4xl mx-auto p-10 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Chào mừng, {user.fullName || 'Người dùng'}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Bạn hiện không có quyền truy cập trang quản lý. Vui lòng đăng nhập bằng tài khoản quản lý để sử dụng chức năng này.</p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            <span className="material-symbols-outlined">logout</span>
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  const selectedSchedule = schedules.find((schedule) => schedule.id === assignment.scheduleId);
  const isAssignmentLocked = !!selectedSchedule?.collector_confirmed;

  const totalSchedules = report?.summary?.total_schedules ?? schedules.length;
  const assignedRoutes = report?.summary?.assigned_routes ?? schedules.filter((item) => item.assigned_truck && item.assigned_driver).length;
  const summary = {
    totalSchedules,
    assignedRoutes,
    openComplaints: report?.summary?.open_complaints ?? complaints.length,
    onTimeRate: totalSchedules > 0 ? Math.round((assignedRoutes / totalSchedules) * 100) : 0,
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-900 py-10 px-4 md:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4.5">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-3xl font-semibold">account_circle</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                  {user.fullName || (normalizeRole(user.role) === ROLES.ADMIN ? 'Admin' : 'Manager')}
                </h1>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  normalizeRole(user.role) === ROLES.ADMIN 
                    ? 'bg-rose-100 text-rose-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {normalizeRole(user.role) === ROLES.ADMIN ? 'Admin' : 'Manager'}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">mail</span> {user.email}
              </p>
              {user.area && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">location_on</span> {user.area}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {normalizeRole(user.role) !== ROLES.ADMIN && (
              <button
                type="button"
                onClick={() => navigate('/dashboard/invoices/new')}
                className="py-2.5 px-4 bg-primary text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">receipt_long</span>
                Tạo hóa đơn
              </button>
            )}
            <button
              onClick={handleLogout}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {managerError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900 p-4 text-sm text-rose-700 dark:text-rose-300">
            {managerError}
          </div>
        )}

        {apiMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            {apiMessage}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 mb-4">Lịch thu gom</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{summary.totalSchedules}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tổng số lịch đang quản lý</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 mb-4">Tuyến đã gán</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{summary.assignedRoutes}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Số tuyến đã được phân công</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 mb-4">Phản ánh mở</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{summary.openComplaints}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Phản ánh chưa xử lý</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 mb-4">Hiệu suất</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{summary.onTimeRate}%</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tuyến gán đúng hạn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Tạo lịch thu gom</p>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Collection Schedule</h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">UI + API Manager</span>
              </div>
              <form className="space-y-4" onSubmit={handleCreateSchedule}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Tên tuyến</span>
                    <input
                      name="routeName"
                      value={newSchedule.routeName}
                      onChange={handleChangeNewSchedule}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="North Route A"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Loại dịch vụ</span>
                    <select
                      name="serviceType"
                      value={newSchedule.serviceType}
                      onChange={handleChangeNewSchedule}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="Recycling">Recycling</option>
                      <option value="Organic">Organic</option>
                      <option value="General">General</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Ngày</span>
                    <input
                      type="date"
                      name="date"
                      value={newSchedule.date}
                      onChange={handleChangeNewSchedule}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Giờ</span>
                    <input
                      type="time"
                      name="time"
                      value={newSchedule.time}
                      onChange={handleChangeNewSchedule}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Khu vực <span className="text-rose-500">*</span></span>
                    <div className="relative mt-2">
                      <select
                        value={selectedProvince}
                        onChange={handleProvinceChange}
                        disabled={loadingProvinces}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none appearance-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:opacity-60"
                      >
                        <option value="">-- Chọn Tỉnh/Thành phố --</option>
                        {provinces.map(p => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                      {loadingProvinces ? (
                        <span className="absolute right-4 top-3.5 h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">expand_more</span>
                      )}
                    </div>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Phường <span className="text-rose-500">*</span></span>
                    <div className="relative mt-2">
                      <select
                        value={selectedWard}
                        onChange={handleWardChange}
                        disabled={loadingWards || !selectedProvince}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none appearance-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:opacity-60"
                      >
                        <option value="">
                          {!selectedProvince ? 'Chọn Tỉnh/Thành trước' : '-- Chọn Phường/Xã --'}
                        </option>
                        {wards.map(w => (
                          <option key={w.code} value={w.code}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                      {loadingWards ? (
                        <span className="absolute right-4 top-3.5 h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">expand_more</span>
                      )}
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Tổ</span>
                    <input
                      name="neighborhood"
                      value={newSchedule.neighborhood}
                      onChange={handleChangeNewSchedule}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="Tổ 12"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Xe thu gom</span>
                    <input
                      name="assignedTruck"
                      value={newSchedule.assignedTruck}
                      onChange={handleChangeNewSchedule}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="TRUCK-402"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Tài xế</span>
                    <input
                      name="assignedDriver"
                      value={newSchedule.assignedDriver}
                      onChange={handleChangeNewSchedule}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="Nguyễn Văn A"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Nhân viên thu gom</span>
                    <select
                      name="assignedCollector"
                      value={newSchedule.assignedCollector}
                      onChange={handleChangeNewSchedule}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="">-- Chưa gán --</option>
                      {collectors.map((c) => (
                        <option key={c.uid} value={c.fullName}>
                          {c.fullName}{c.area ? ` — ${c.area}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Ghi chú</span>
                    <input
                      name="notes"
                      value={newSchedule.notes}
                      onChange={handleChangeNewSchedule}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="Thông tin thêm về tuyến"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={managerLoading}
                  className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {managerLoading ? 'Đang lưu...' : 'Tạo lịch thu gom'}
                </button>
              </form>
            </section>

            <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Phân tuyến</p>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assign Collection Route</h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Gán xe & tài xế</span>
              </div>
              <form className="space-y-4" onSubmit={handleAssignRoute}>
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Chọn lịch</span>
                  <select
                    name="scheduleId"
                    value={assignment.scheduleId}
                    onChange={handleChangeAssignment}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    {schedules.length === 0 ? (
                      <option value="">Không có lịch</option>
                    ) : (
                      schedules.map((schedule) => (
                        <option key={schedule.id} value={schedule.id}>
                          {schedule.route_name} | {formatDate(schedule.schedule_date)}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Xe thu gom</span>
                    <input
                      name="assignedTruck"
                      value={assignment.assignedTruck}
                      onChange={handleChangeAssignment}
                      disabled={managerLoading || isAssignmentLocked}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="TRUCK-402"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Tài xế</span>
                    <input
                      name="assignedDriver"
                      value={assignment.assignedDriver}
                      onChange={handleChangeAssignment}
                      disabled={managerLoading || isAssignmentLocked}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="Nguyễn Văn A"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Nhân viên thu gom</span>
                    <select
                      name="assignedCollector"
                      value={assignment.assignedCollector}
                      onChange={handleChangeAssignment}
                      disabled={managerLoading || isAssignmentLocked}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:opacity-60"
                    >
                      <option value="">-- Chưa gán --</option>
                      {collectors.map((c) => (
                        <option key={c.uid} value={c.fullName}>
                          {c.fullName}{c.area ? ` — ${c.area}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={managerLoading || schedules.length === 0 || isAssignmentLocked}
                    className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {managerLoading ? 'Đang gán tuyến...' : 'Gán tuyến cho lịch'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRoute}
                    disabled={managerLoading || !assignment.scheduleId || isAssignmentLocked}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100"
                  >
                    {managerLoading ? 'Đang lưu tuyến...' : 'Lưu route đã chỉnh sửa'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRoute}
                    disabled={managerLoading || !assignment.scheduleId || !selectedSchedule?.assigned_truck || !selectedSchedule?.assigned_driver || isAssignmentLocked}
                    className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {managerLoading ? 'Đang xác nhận...' : 'Placeholder: Xác nhận tuyến'}
                  </button>
                </div>
              </form>
              {isAssignmentLocked && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  Tuyến này đã được nhân viên xác nhận, nên các chỉnh sửa tiếp theo bị khoá.
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-0 shadow-sm">
              <CollectionRouteMap
                title={assignment.scheduleId ? 'Route Planner' : 'Route Map'}
                collectorName={assignment.assignedCollector || 'Chưa gán'}
                routePoints={routePoints}
                setRoutePoints={setRoutePoints}
                readOnly={isAssignmentLocked}
              />
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Báo cáo</p>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Generate Reports</h2>
                </div>
                <button
                  onClick={downloadReport}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                >
                  Xuất báo cáo
                </button>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tổng lịch thu gom</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalSchedules}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tuyến đã gán</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.assignedRoutes}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Phản ánh mở</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.openComplaints}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Duyệt kết quả</p>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Phản ánh chờ duyệt</h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {feedbackReports.filter((r) => ['resolved_pending_approval', 'resolved'].includes((r.status || '').toLowerCase())).length} chờ duyệt
                </span>
              </div>
              <div className="space-y-4">
                {feedbackReports.filter((r) => ['resolved_pending_approval', 'resolved'].includes((r.status || '').toLowerCase())).length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-4 text-sm text-slate-500 dark:text-slate-400">
                    Không có phản ánh chờ duyệt.
                  </div>
                ) : (
                  feedbackReports
                    .filter((r) => ['resolved_pending_approval', 'resolved'].includes((r.status || '').toLowerCase()))
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.id} className="rounded-2xl border border-amber-200 dark:border-amber-900/50 p-4 bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{item.description}</p>
                            <p className="mt-2 text-xs text-slate-400">{item.ward}{item.neighborhood ? ` · ${item.neighborhood}` : ''}</p>
                          </div>
                          <button
                            type="button"
                            disabled={managerLoading}
                            onClick={() => handleApproveReport(item.id)}
                            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Duyệt
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quản lý phản ánh</p>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Phản ánh cư dân</h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{complaints.length} phản ánh</span>
              </div>

              {/* Status filter tabs */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'Open', label: 'Mới' },
                  { key: 'in_resolve', label: 'Đang xử lý' },
                  { key: 'resolved', label: 'Đã giải quyết' },
                  { key: 'rejected', label: 'Từ chối' },
                ].map((tab) => {
                  const count = tab.key === 'all'
                    ? complaints.length
                    : complaints.filter((c) => (c.status || 'Open').toLowerCase() === tab.key.toLowerCase()).length;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setComplaintFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                        complaintFilter === tab.key
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      {tab.label} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {(() => {
                  const filtered = complaintFilter === 'all'
                    ? complaints
                    : complaints.filter((c) => (c.status || 'Open').toLowerCase() === complaintFilter.toLowerCase());
                  if (filtered.length === 0) {
                    return (
                      <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                        Không có phản ánh nào.
                      </div>
                    );
                  }
                  return filtered.map((item) => {
                    const s = (item.status || 'Open').toLowerCase();
                    let statusColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
                    let statusLabel = 'Chờ xử lý';
                    if (s === 'in_resolve') { statusColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'; statusLabel = 'Đang xử lý'; }
                    else if (s === 'resolved' || s === 'completed') { statusColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'; statusLabel = 'Đã giải quyết'; }
                    else if (s === 'rejected') { statusColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'; statusLabel = 'Từ chối'; }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => { setViewingComplaint(item); setComplaintComment(item.reply || ''); }}
                        className="w-full text-left rounded-2xl border border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950/50 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{item.title || 'Phản ánh mới'}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {item.userName || 'Cư dân'} · {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : ''}
                            </p>
                          </div>
                          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.description || 'Không có nội dung chi tiết.'}</p>
                        {item.type && (
                          <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                            {item.type}
                          </span>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </aside>
        </div>

        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Bảng chi tiết</p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Collection schedule list</h2>
            </div>
            <button
              onClick={loadManagerData}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Làm mới
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Tuyến</th>
                  <th className="px-4 py-3">Ngày giờ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Xe</th>
                  <th className="px-4 py-3">Tài xế</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">Không có lịch thu gom nào.</td>
                  </tr>
                ) : (
                  schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/70 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {schedule.route_name || 'Không xác định'}
                          {schedule.incident && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                              <span className="material-symbols-outlined text-xs">warning</span>
                              Sự cố
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(schedule.schedule_date)} {schedule.schedule_time || ''}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusBadge(schedule.status)}`}>
                          {schedule.status || 'Planned'}
                        </span>
                      </td>
                      <td className="px-4 py-4">{schedule.assigned_truck || 'Chưa gán'}</td>
                      <td className="px-4 py-4">{schedule.assigned_driver || 'Chưa gán'}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {schedule.incident && (
                            <button
                              type="button"
                              onClick={() => setViewingIncident(schedule)}
                              className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span>
                              Xem sự cố
                            </button>
                          )}
                          {schedule.collector_confirmed ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                              <span className="material-symbols-outlined text-sm">lock</span>
                              Đã khóa
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={managerLoading}
                              onClick={() => handleDeleteSchedule(schedule.id, schedule.route_name)}
                              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {viewingIncident && viewingIncident.incident && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setViewingIncident(null)}>
            <div
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-100 dark:border-slate-700 p-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                      <span className="material-symbols-outlined text-lg">report</span>
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Báo cáo sự cố</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tuyến: {viewingIncident.route_name || 'Không xác định'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingIncident(null)}
                  className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Loại sự cố</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {{
                        vehicle_breakdown: 'Xe hỏng / sự cố phương tiện',
                        road_blocked: 'Đường tắc / không thể di chuyển',
                        overload: 'Điểm tập kết quá tải',
                        hazardous_waste: 'Rác nguy hại sai quy định',
                        other: 'Sự cố khác',
                      }[viewingIncident.incident.incidentType] || viewingIncident.incident.incidentType || 'Không xác định'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Thời gian báo cáo</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {viewingIncident.incident.reportedAt ? new Date(viewingIncident.incident.reportedAt).toLocaleString('vi-VN') : 'Không rõ'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Nhân viên thu gom</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {viewingIncident.assigned_collector || viewingIncident.assigned_driver || 'Chưa gán'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Mô tả sự cố</p>
                  <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {viewingIncident.incident.description || 'Không có mô tả.'}
                  </div>
                </div>

                {viewingIncident.incident.evidenceUrls && viewingIncident.incident.evidenceUrls.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Bằng chứng ({viewingIncident.incident.evidenceUrls.length} ảnh)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {viewingIncident.incident.evidenceUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-900"
                        >
                          <img
                            src={url}
                            alt={`Bằng chứng ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                          <div className="hidden items-center justify-center w-full h-full text-slate-400">
                            <span className="material-symbols-outlined text-3xl">broken_image</span>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl drop-shadow-lg">zoom_in</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(!viewingIncident.incident.evidenceUrls || viewingIncident.incident.evidenceUrls.length === 0) && (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                    <span className="material-symbols-outlined text-2xl opacity-30 block mb-1">image_not_supported</span>
                    Không có ảnh bằng chứng đính kèm.
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 p-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingIncident(null)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======= COMPLAINT DETAIL MODAL ======= */}
        {viewingComplaint && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => { setViewingComplaint(null); setComplaintComment(''); }}>
            <div
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="border-b border-slate-100 dark:border-slate-700 p-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                      <span className="material-symbols-outlined text-lg">rate_review</span>
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chi tiết phản ánh</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Gửi bởi: {viewingComplaint.userName || 'Cư dân'} · {viewingComplaint.created_at ? new Date(viewingComplaint.created_at).toLocaleString('vi-VN') : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setViewingComplaint(null); setComplaintComment(''); }}
                  className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Loại phản ánh</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{viewingComplaint.type || 'Không xác định'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Trạng thái</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {{
                        'open': 'Chờ xử lý',
                        'in_resolve': 'Đang xử lý',
                        'resolved': 'Đã giải quyết',
                        'rejected': 'Đã từ chối',
                      }[(viewingComplaint.status || 'Open').toLowerCase()] || viewingComplaint.status}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Khu vực</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {viewingComplaint.neighborhood ? `${viewingComplaint.neighborhood}, ` : ''}{viewingComplaint.ward}{viewingComplaint.city ? `, ${viewingComplaint.city}` : ''}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Tiêu đề</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{viewingComplaint.title}</p>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Nội dung chi tiết</p>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {viewingComplaint.description || 'Không có mô tả.'}
                  </div>
                </div>

                {/* Images (placeholder for future) */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Hình ảnh đính kèm</p>
                  {viewingComplaint.imageUrls && viewingComplaint.imageUrls.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {viewingComplaint.imageUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-900"
                        >
                          <img
                            src={url}
                            alt={`Ảnh phản ánh ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                          <div className="hidden items-center justify-center w-full h-full text-slate-400">
                            <span className="material-symbols-outlined text-3xl">broken_image</span>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl drop-shadow-lg">zoom_in</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                      <span className="material-symbols-outlined text-2xl opacity-30 block mb-1">image_not_supported</span>
                      Chưa có hình ảnh đính kèm. Chức năng tải ảnh sẽ được cập nhật trong tương lai.
                    </div>
                  )}
                </div>

                {/* Previous reply (if any) */}
                {viewingComplaint.replied_by && viewingComplaint.reply && (viewingComplaint.status || '').toLowerCase() !== 'open' && (
                  <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Phản hồi trước đó</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{viewingComplaint.reply}</p>
                    <p className="text-[10px] text-slate-400">Bởi {viewingComplaint.replied_by} · {viewingComplaint.replied_at ? new Date(viewingComplaint.replied_at).toLocaleString('vi-VN') : ''}</p>
                  </div>
                )}

                {/* Manager Comment Input */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Nhận xét của quản lý</p>
                  <textarea
                    value={complaintComment}
                    onChange={(e) => setComplaintComment(e.target.value)}
                    rows={3}
                    placeholder="Nhập nhận xét, lý do từ chối, hoặc phản hồi cho cư dân..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer — Action Buttons */}
              <div className="border-t border-slate-100 dark:border-slate-700 p-4 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setViewingComplaint(null); setComplaintComment(''); }}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={complaintActionLoading}
                  onClick={() => handleComplaintAction(viewingComplaint.id, 'in_resolve')}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">pending</span>
                  Đang xử lý
                </button>
                <button
                  type="button"
                  disabled={complaintActionLoading}
                  onClick={() => handleComplaintAction(viewingComplaint.id, 'resolved')}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Đã giải quyết
                </button>
                <button
                  type="button"
                  disabled={complaintActionLoading}
                  onClick={() => handleComplaintAction(viewingComplaint.id, 'rejected')}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">cancel</span>
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

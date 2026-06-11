import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { ROLES, normalizeRole } from '../../constants/roles';
import CollectionRouteMap from '../../components/CollectionRouteMap';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
  const [user, setUser] = useState(null);
  const [managerLoading, setManagerLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [managerError, setManagerError] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [report, setReport] = useState(null);

  const [newSchedule, setNewSchedule] = useState({
    routeName: 'North Route A',
    serviceType: 'Recycling',
    date: '2026-06-10',
    time: '08:00',
    city: 'Đà Nẵng',
    ward: 'Phường An Hải Tây',
    neighborhood: 'Tổ 12',
    assignedTruck: 'TRUCK-402',
    assignedDriver: 'Nguyễn Văn A',
    notes: 'Gán tuyến thu gom khu dân cư phía Bắc.',
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

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    const handleAuthChange = () => {
      setUser(authService.getCurrentUser());
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [navigate]);

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
      loadManagerData();
    }
  }, [user, navigate]);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authService.getToken()}`,
  });

  const loadManagerData = async () => {
    setManagerLoading(true);
    setManagerError('');
    try {
      await Promise.all([fetchSchedules(), fetchComplaints(), fetchReport()]);
    } catch (error) {
      setManagerError(error.message || 'Không thể tải dữ liệu quản lý.');
    } finally {
      setManagerLoading(false);
    }
  };

  const fetchSchedules = async () => {
    const response = await fetch(`${API_BASE}/api/manager/schedules`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
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
    const response = await fetch(`${API_BASE}/api/manager/complaints`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tải phản ánh.');
    setComplaints(data);
    return data;
  };

  const fetchReport = async () => {
    const response = await fetch(`${API_BASE}/api/manager/reports`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tải báo cáo.');
    setReport(data);
    return data;
  };

  const handleCreateSchedule = async (event) => {
    event.preventDefault();
    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');

    try {
      const response = await fetch(`${API_BASE}/api/manager/schedules`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newSchedule,
          routePoints,
        }),
      });
      const data = await response.json();
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ routePoints }),
      });
      const data = await response.json();
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
        headers: getAuthHeaders(),
        body: JSON.stringify({
          scheduleId: assignment.scheduleId,
          assignedTruck: assignment.assignedTruck,
          assignedDriver: assignment.assignedDriver,
          assignedCollector: assignment.assignedCollector,
        }),
      });
      const data = await response.json();
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ scheduleId: assignment.scheduleId }),
      });
      const data = await response.json();
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
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">{user.fullName || 'Manager'}</h1>
                <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Manager</span>
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
            <button
              type="button"
              onClick={() => navigate('/dashboard/invoices/new')}
              className="py-2.5 px-4 bg-primary text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">receipt_long</span>
              Tạo hóa đơn
            </button>
            {normalizeRole(user.role) === ROLES.ADMIN && (
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">manage_accounts</span>
                Quản lý người dùng
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
                    <span className="text-sm text-slate-600 dark:text-slate-300">Khu vực</span>
                    <input
                      name="city"
                      value={newSchedule.city}
                      onChange={handleChangeNewSchedule}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="Đà Nẵng"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Phường</span>
                    <input
                      name="ward"
                      value={newSchedule.ward}
                      onChange={handleChangeNewSchedule}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="Phường An Hải Tây"
                    />
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

                <div className="grid gap-4 md:grid-cols-2">
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
                    <span className="text-sm text-slate-600 dark:text-slate-300">Nhân viên</span>
                    <input
                      name="assignedCollector"
                      value={assignment.assignedCollector}
                      onChange={handleChangeAssignment}
                      disabled={managerLoading || isAssignmentLocked}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="Collector placeholder"
                    />
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
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Yêu cầu</p>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">View Complaints</h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{complaints.length} phản ánh</span>
              </div>
              <div className="space-y-4">
                {complaints.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-4 text-sm text-slate-500 dark:text-slate-400">Chưa có phản ánh mới.</div>
                ) : (
                  complaints.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950/50">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{item.title || 'Phản ánh mới'}</p>
                        <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{item.status || 'Open'}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{item.description || item.message || 'Không có nội dung chi tiết.'}</p>
                    </div>
                  ))
                )}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">Không có lịch thu gom nào.</td>
                  </tr>
                ) : (
                  schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/70 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{schedule.route_name || 'Không xác định'}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(schedule.schedule_date)} {schedule.schedule_time || ''}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusBadge(schedule.status)}`}>
                          {schedule.status || 'Planned'}
                        </span>
                      </td>
                      <td className="px-4 py-4">{schedule.assigned_truck || 'Chưa gán'}</td>
                      <td className="px-4 py-4">{schedule.assigned_driver || 'Chưa gán'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

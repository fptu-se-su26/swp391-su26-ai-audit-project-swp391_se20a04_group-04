import { useEffect, useRef, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import managerReportService from '../../services/managerReportService';
import managerScheduleService from '../../services/managerScheduleService';
import complaintService from '../../services/complaintService';
import routeService from '../../services/routeService';
import teamService from '../../services/teamService';
import { ROLES, normalizeRole } from '../../constants/roles';
import CollectionRouteMap from '../../components/CollectionRouteMap';
import AIComplaintSummary from '../../components/AIComplaintSummary';
import RouteManager from '../../components/RouteManager';
import TeamManager from '../../components/TeamManager';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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

const normalizeSchedules = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.schedules)) return data.schedules;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

function getStatusBadge(status) {
  const state = (status || '').toLowerCase();
  if (state.includes('confirmed')) return 'bg-emerald-200 text-emerald-800';
  if (state.includes('assigned')) return 'bg-emerald-100 text-emerald-700';
  if (state.includes('planned')) return 'bg-sky-100 text-sky-700';
  if (state.includes('delayed')) return 'bg-amber-100 text-amber-700';
  if (state.includes('completed_pending_approval')) return 'bg-amber-100 text-amber-800';
  if (state.includes('completed')) return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
}

function formatStatusLabel(status) {
  const state = (status || '').toLowerCase();
  if (state === 'completed_pending_approval') return 'Chờ xác nhận';
  if (state === 'in_progress') return 'Đang thu gom';
  if (state === 'completed') return 'Đã xác nhận';
  if (state === 'delayed') return 'Bị hoãn';
  return status || 'Planned';
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

function formatScheduleTime(schedule) {
  if (!schedule) return 'Chưa đặt giờ';
  if (schedule.schedule_time) return schedule.schedule_time;
  if (schedule.time) return schedule.time;
  if (schedule.scheduleTime) return schedule.scheduleTime;

  if (schedule.schedule_date) {
    if (typeof schedule.schedule_date === 'string' && schedule.schedule_date.includes('T')) {
      const timePart = schedule.schedule_date.split('T')[1]?.substring(0, 5);
      if (timePart && timePart !== '00:00') return timePart;
    }
    try {
      const d = new Date(schedule.schedule_date);
      if (!isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        if (h !== '00' || m !== '00') return `${h}:${m}`;
      }
    } catch (e) {
      // Ignore
    }
  }
  return 'Chưa đặt giờ';
}

const sanitizeRoutePoints = (points) => {
  if (!Array.isArray(points)) return [];
  return points.reduce((valid, point) => {
    // Hỗ trợ cả dạng [lat, lng] array lẫn { lat, lng } object (Firestore format)
    if (Array.isArray(point) && point.length >= 2) {
      const lat = Number(point[0]);
      const lng = Number(point[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) valid.push([lat, lng]);
      return valid;
    }
    if (point && typeof point === 'object' && point.lat !== undefined && point.lng !== undefined) {
      const lat = Number(point.lat);
      const lng = Number(point.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) valid.push([lat, lng]);
      return valid;
    }
    return valid;
  }, []);
};

export default function Dashboard() {
  const navigate = useNavigate();
  // Khởi tạo user trực tiếp để tránh setState-in-effect
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [dashStats, setDashStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [managerLoading, setManagerLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [managerError, setManagerError] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [feedbackReports, setFeedbackReports] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [report, setReport] = useState(null);
  const [viewingIncident, setViewingIncident] = useState(null);
  const [completionPending, setCompletionPending] = useState([]);
  const [completionGroups, setCompletionGroups] = useState([]);
  const [viewingCompletion, setViewingCompletion] = useState(null);
  const [rejectCompletionNote, setRejectCompletionNote] = useState('');

  // Salary management states
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [salariesList, setSalariesList] = useState([]);
  const [salaryMonth, setSalaryMonth] = useState(() => new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(() => new Date().getFullYear());
  const [selectedCollectorSalary, setSelectedCollectorSalary] = useState(null);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    baseSalary: 8000000,
    bonus: 0,
    bonusReason: '',
  });

  // Complaint management state
  const [viewingComplaint, setViewingComplaint] = useState(null);
  const [complaintFilter, setComplaintFilter] = useState('all');
  const [complaintComment, setComplaintComment] = useState('');
  const [complaintActionLoading, setComplaintActionLoading] = useState(false);

  const [newSchedule, setNewSchedule] = useState({
    routeId: '',
    serviceType: 'Recycling',
    date: new Date().toISOString().slice(0, 10),
    time: '08:00',
    assignedTruck: 'TRUCK-402',
    assignedDriver: '',
    assignedType: 'team',
    assignedCollector: '',
    teamId: '',
    city: '',
    ward: '',
    neighborhood: '',
    notes: '',
  });

  // Helper xử lý ngày tháng chuẩn múi giờ địa phương (tránh lệch UTC)
  function toLocalDateString(dateObj) {
    if (!dateObj || Number.isNaN(dateObj.getTime())) return '';
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseLocalDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return new Date();
    const parts = dateStr.split('-');
    if (parts.length < 3) return new Date();
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function getMondayOfWeek(dateStr) {
    const d = parseLocalDate(dateStr);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return toLocalDateString(d);
  }

  function getDateForDayOffset(weekMonday, dayIndex) {
    const d = parseLocalDate(weekMonday);
    d.setDate(d.getDate() + dayIndex);
    return toLocalDateString(d);
  }

  // Week-mode: create one schedule per selected day for a whole week
  const [scheduleMode, setScheduleMode] = useState('week'); // 'single' | 'week'
  const [weekStartDate, setWeekStartDate] = useState(() => getMondayOfWeek(toLocalDateString(new Date())));
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri

  const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  const [assignment, setAssignment] = useState({
    scheduleId: '',
    assignedTruck: 'TRUCK-402',
    assignedDriver: '',
    assignedCollector: '',
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

  // Bộ lọc & Tìm kiếm cho bảng Nhân viên thu gom
  const [collectorSearchText, setCollectorSearchText] = useState('');
  const [collectorAreaFilter, setCollectorAreaFilter] = useState('all');
  const [collectorTeamFilter, setCollectorTeamFilter] = useState('all');

  // Chế độ xem Lịch thu gom: 'monthgrid' | 'calendar' (Theo Đội nhóm) | 'table' (Bảng chi tiết)
  const [scheduleViewMode, setScheduleViewMode] = useState('monthgrid');
  const [viewingGroupDetail, setViewingGroupDetail] = useState(null);
  const [viewingRouteMapSchedule, setViewingRouteMapSchedule] = useState(null);

  // Manager Attendance tab states
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendanceMonth, setAttendanceMonth] = useState(() => new Date().getMonth() + 1);
  const [attendanceYear, setAttendanceYear] = useState(() => new Date().getFullYear());
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceSubTab, setAttendanceSubTab] = useState('daily'); // 'daily' | 'monthly'

  useEffect(() => {
    if (activeTab === 'attendance' && user) {
      let cancelled = false;
      (async () => {
        setLoadingAttendance(true);
        try {
          const data = await managerReportService.getAttendances(attendanceDate, attendanceMonth, attendanceYear);
          if (!cancelled) setAttendanceSummary(data);
        } catch (err) {
          console.error('Lỗi tải chấm công:', err);
        } finally {
          if (!cancelled) setLoadingAttendance(false);
        }
      })();
      return () => { cancelled = true; };
    }
  }, [activeTab, attendanceDate, attendanceMonth, attendanceYear, user]);
  // Bộ lọc lịch
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [scheduleTeamFilter, setScheduleTeamFilter] = useState('all'); // filter by team id

  // Ref cho modal chi tiết: auto-scroll về đầu mỗi khi mở
  const groupDetailModalRef = useRef(null);
  useEffect(() => {
    if (viewingGroupDetail && groupDetailModalRef.current) {
      groupDetailModalRef.current.scrollTop = 0;
    }
  }, [viewingGroupDetail]);

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

    const normalizedSchedules = normalizeSchedules(data);
    setSchedules(normalizedSchedules);
    if (normalizedSchedules.length > 0) {
      const selectedId = assignment.scheduleId || normalizedSchedules[0].id;
      const selectedSchedule = normalizedSchedules.find((schedule) => schedule.id === selectedId);
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
    return normalizedSchedules;
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

  const fetchCompletionPending = async () => {
    const data = await managerScheduleService.getPendingCompletions();
    setCompletionPending(data.pending || []);
    setCompletionGroups(data.groups || []);
    return data;
  };

  const handleApproveCompletion = async (scheduleId) => {
    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');
    try {
      await managerScheduleService.approveCompletion(scheduleId, 'Manager đã kiểm tra và xác nhận hoàn thành tuyến.');
      setApiMessage('Đã xác nhận hoàn thành tuyến.');
      setViewingCompletion(null);
      await Promise.all([fetchSchedules(), fetchCompletionPending()]);
    } catch (error) {
      setManagerError(error.message || 'Không thể xác nhận hoàn thành tuyến.');
    } finally {
      setManagerLoading(false);
    }
  };

  const handleRejectCompletion = async (scheduleId) => {
    if (rejectCompletionNote.trim().length < 10) {
      setManagerError('Vui lòng nhập lý do từ chối từ 10 ký tự trở lên.');
      return;
    }
    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');
    try {
      await managerScheduleService.rejectCompletion(scheduleId, rejectCompletionNote.trim());
      setApiMessage('Đã từ chối xác nhận. Tuyến trả về collector để xử lý tiếp.');
      setViewingCompletion(null);
      setRejectCompletionNote('');
      await Promise.all([fetchSchedules(), fetchCompletionPending()]);
    } catch (error) {
      setManagerError(error.message || 'Không thể từ chối xác nhận tuyến.');
    } finally {
      setManagerLoading(false);
    }
  };

  const handleApproveDay = async (date) => {
    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');
    try {
      const result = await managerScheduleService.approveDay(date, `Xác nhận toàn bộ tuyến ngày ${formatDate(`${date}T12:00:00`)}.`);
      setApiMessage(result.message || 'Đã xác nhận toàn bộ tuyến trong ngày.');
      await Promise.all([fetchSchedules(), fetchCompletionPending()]);
    } catch (error) {
      setManagerError(error.message || 'Không thể xác nhận toàn bộ tuyến trong ngày.');
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

  const fetchRoutes = async () => {
    const data = await routeService.getRoutes();
    setRoutes(data);
  };

  const fetchTeams = async () => {
    const data = await teamService.getTeams();
    setTeams(data);
  };

  const fetchTeamPerformance = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/manager/team-performance`, {
        headers: await getAuthHeaders(),
      });
      const data = await safeJson(response);
      if (response.ok && data.success) {
        setTeamPerformance(data.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải hiệu suất đội:', err);
    }
  };

  const fetchCollectorSalaries = async (m, y) => {
    try {
      const queryMonth = m || salaryMonth;
      const queryYear = y || salaryYear;
      const response = await fetch(`${API_BASE}/api/manager/collector-salaries?month=${queryMonth}&year=${queryYear}`, {
        headers: await getAuthHeaders(),
      });
      const data = await safeJson(response);
      if (response.ok && data.success) {
        setSalariesList(data.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải bảng lương:', err);
    }
  };

  const handleSetSalary = async (e) => {
    e.preventDefault();
    if (!selectedCollectorSalary) return;
    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');
    try {
      const response = await fetch(`${API_BASE}/api/manager/collector-salaries`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          collectorId: selectedCollectorSalary.uid,
          collectorName: selectedCollectorSalary.fullName,
          month: Number(salaryMonth),
          year: Number(salaryYear),
          baseSalary: Number(salaryForm.baseSalary),
          bonus: Number(salaryForm.bonus),
          bonusReason: salaryForm.bonusReason,
        }),
      });
      const data = await safeJson(response);
      if (!response.ok) throw new Error(data.error || 'Không thể thiết lập lương.');
      setApiMessage('Cập nhật lương/thưởng thành công.');
      setShowSalaryForm(false);
      setSelectedCollectorSalary(null);
      await fetchCollectorSalaries(salaryMonth, salaryYear);
    } catch (error) {
      setManagerError(error.message || 'Lỗi khi cập nhật lương.');
    } finally {
      setManagerLoading(false);
    }
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
        fetchCompletionPending(),
        fetchRoutes(),
        fetchTeams(),
        fetchTeamPerformance(),
        fetchCollectorSalaries(salaryMonth, salaryYear),
      ]);
    } catch (error) {
      setManagerError(error.message || 'Không thể tải dữ liệu quản lý.');
    } finally {
      setManagerLoading(false);
    }

    // Load chart stats independently (non-blocking)
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/api/manager/dashboard/stats`, { headers: await getAuthHeaders() });
      if (res.ok) setDashStats(await res.json());
    } catch { /* stats are optional */ } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user && (normalizeRole(user.role) === ROLES.MANAGER || normalizeRole(user.role) === ROLES.ADMIN)) {
      fetchCollectorSalaries(salaryMonth, salaryYear);
    }
  }, [salaryMonth, salaryYear]);

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

  // Fetch dashboard stats when overview tab is active
  useEffect(() => {
    if (activeTab !== 'overview' || !user) return;
    let cancelled = false;
    (async () => {
      setLoadingStats(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/api/manager/dashboard/stats`, { headers });
        const data = await res.json();
        if (!cancelled) setDashStats(data);
      } catch {
        if (!cancelled) setDashStats(null);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const handleCreateSchedule = async (event) => {
    event.preventDefault();
    setManagerLoading(true);
    setApiMessage('');
    setManagerError('');

    try {
      let routeName = '';
      let city = '';
      let ward = '';
      let neighborhood = '';
      let rtPoints = [];

      if (newSchedule.routeId) {
        const selectedRoute = routes.find(r => r.id === newSchedule.routeId);
        if (selectedRoute) {
          routeName = selectedRoute.route_name;
          // Ưu tiên lựa chọn trên form (newSchedule), nếu trống mới dùng mặc định của Tuyến mẫu
          city = newSchedule.city || selectedRoute.city;
          ward = newSchedule.ward || selectedRoute.ward;
          neighborhood = newSchedule.neighborhood || selectedRoute.neighborhood;
          rtPoints = sanitizeRoutePoints(selectedRoute.route_points || []);
        }
      }

      let assignedCollectors = [];
      let teamId = null;

      if (newSchedule.assignedType === 'solo') {
        const collector = collectors.find(c => c.uid === newSchedule.assignedCollector);
        if (collector) assignedCollectors = [{ id: collector.uid, name: collector.fullName }];
      } else {
        teamId = newSchedule.teamId;
        const selectedTeam = teams.find(t => t.id === newSchedule.teamId);
        if (selectedTeam) assignedCollectors = selectedTeam.members || [];
      }

      const basePayload = { ...newSchedule, routeName, city, ward, neighborhood, assignedCollectors, teamId, routePoints: rtPoints };

      if (!routeName) {
        throw new Error('Vui lòng chọn Tuyến thu gom trước khi tạo lịch.');
      }
      if (newSchedule.assignedType === 'team' && !teamId) {
        throw new Error('Vui lòng chọn Đội nhóm.');
      }
      if (newSchedule.assignedType === 'solo' && !newSchedule.assignedCollector) {
        throw new Error('Vui lòng chọn Nhân viên thu gom.');
      }

      // Week mode: create one schedule per selected day
      const datesToCreate = scheduleMode === 'week'
        ? selectedDays.map(d => getDateForDayOffset(weekStartDate, d - 1))
        : [newSchedule.date];

      if (datesToCreate.length === 0) {
        throw new Error('Vui lòng chọn ít nhất 1 ngày trong tuần.');
      }

      const headers = await getAuthHeaders();
      const results = await Promise.allSettled(
        datesToCreate.map(date =>
          fetch(`${API_BASE}/api/manager/schedules`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...basePayload, date }),
          }).then(r => r.json())
        )
      );

      const failed = results.filter(r => r.status === 'rejected' || r.value?.error);
      if (failed.length === datesToCreate.length) {
        const firstMsg = failed[0]?.value?.error || failed[0]?.reason?.message || 'Kiểm tra console để biết chi tiết.';
        throw new Error(`Tất cả lịch đều tạo thất bại: ${firstMsg}`);
      }

      const created = datesToCreate.length - failed.length;
      setApiMessage(`Đã tạo ${created}/${datesToCreate.length} lịch thành công${failed.length > 0 ? ` (${failed.length} thất bại do trùng lịch)` : ''}. `);
      await fetchSchedules();
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
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const dateStr = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('EcoSchedule', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Bao cao he thong quan ly thu gom rac', 14, 20);
    doc.text(`Ngay xuat: ${dateStr}`, pageWidth - 14, 20, { align: 'right' });

    let y = 36;

    // Summary section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Tong quan', 14, y);
    y += 6;

    const summary = report.summary || {};
    autoTable(doc, {
      startY: y,
      head: [['Chi so', 'Gia tri']],
      body: [
        ['Tong lich thu gom', String(summary.total_schedules ?? 0)],
        ['Tuyen da gan', String(summary.assigned_routes ?? 0)],
        ['Lich sap toi', String(summary.upcoming_schedules ?? 0)],
        ['Phan anh dang mo', String(summary.open_complaints ?? 0)],
      ],
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 253, 250] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;

    // By service type
    const byServiceType = report.by_service_type || {};
    const serviceEntries = Object.entries(byServiceType);
    if (serviceEntries.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Phan loai theo loai dich vu', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Loai dich vu', 'So luong']],
        body: serviceEntries.map(([k, v]) => [k, String(v)]),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Schedules table (abbreviated)
    const schedules = report.schedules || [];
    if (schedules.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`Danh sach lich thu gom (${schedules.length} lich)`, 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Tuyen', 'Ngay', 'Loai DV', 'Xe', 'Tai xe']],
        body: schedules.slice(0, 50).map((s) => [
          s.route_name || s.id || '',
          s.schedule_date ? new Date(s.schedule_date).toLocaleDateString('vi-VN') : '',
          s.service_type || '',
          s.assigned_truck || 'Chua gan',
          s.assigned_driver || 'Chua gan',
        ]),
        styles: { fontSize: 8, cellPadding: 2, overflow: 'ellipsize' },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 25 }, 2: { cellWidth: 30 } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Complaints table (abbreviated)
    const complaints = report.complaints || [];
    if (complaints.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`Danh sach phan anh (${complaints.length} phan anh)`, 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Tieu de', 'Trang thai', 'Ngay tao']],
        body: complaints.slice(0, 30).map((c) => [
          c.title || c.description || c.id || '',
          c.status || '',
          c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : '',
        ]),
        styles: { fontSize: 8, cellPadding: 2, overflow: 'ellipsize' },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        columnStyles: { 0: { cellWidth: 90 } },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer on each page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`EcoSchedule © ${new Date().getFullYear()} — Trang ${i}/${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    }

    doc.save(`ecoschedule-report-${new Date().toISOString().slice(0, 10)}.pdf`);
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
        setRoutePoints(sanitizeRoutePoints(selectedSchedule.route_points || []));
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

        {/* Tab Navigation */}
        {isManager && (
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-1.5 shadow-sm w-fit">
            {[
              { id: 'overview', label: 'Tổng quan', icon: 'dashboard' },
              { id: 'work', label: 'Quản lý lịch', icon: 'event_note' },
              { id: 'collectors', label: 'Nhân sự', icon: 'groups' },
              { id: 'attendance', label: 'Chấm công ca làm', icon: 'how_to_reg' },
              { id: 'complaints', label: 'Phản ánh & Sự cố', icon: 'feedback' },
              { id: 'salaries', label: 'Lương & Hiệu suất', icon: 'payments' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards — chỉ hiển thị ở tab Tổng quan */}
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
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 mb-4">Lương hiệu suất</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{summary.onTimeRate}%</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tuyến gán đúng hạn</p>
              </div>
            </div>
            {loadingStats ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <span className="h-6 w-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                <p className="text-sm text-slate-500">Đang tải thống kê...</p>
              </div>
            ) : dashStats ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue line chart */}
                  <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Doanh thu 6 tháng gần đây</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={dashStats.revenueChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={v => `${Number(v).toLocaleString('vi-VN')} ₫`} />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Complaints line chart */}
                  <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Phản ánh 4 tuần gần đây</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={dashStats.complaintsChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="received" stroke="#f59e0b" strokeWidth={2} name="Tiếp nhận" />
                        <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Đã giải quyết" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Invoice status pie */}
                  <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Trạng thái hóa đơn (tháng này)</h3>
                    {dashStats.invoiceStatusChart && dashStats.invoiceStatusChart.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={dashStats.invoiceStatusChart.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                            {dashStats.invoiceStatusChart.filter(d => d.value > 0).map((entry, i) => (
                              <Cell key={i} fill={['#10b981','#f59e0b','#ef4444'][i % 3]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[220px] text-slate-400 text-sm">
                        <span className="material-symbols-outlined text-3xl mb-2 text-slate-300 dark:text-slate-600">receipt_long</span>
                        <p className="font-medium text-slate-500 dark:text-slate-400">Chưa có dữ liệu hóa đơn tháng này.</p>
                      </div>
                    )}
                  </div>

                  {/* Collector payload bar */}
                  <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Tuyến hoàn thành của nhân viên (tuần này)</h3>
                    {dashStats.collectorChart.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={dashStats.collectorChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="collector" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="completed" fill="#10b981" name="Tuyến hoàn thành" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-16">Chưa có dữ liệu tuần này.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 text-center py-16">Không thể tải thống kê. Vui lòng thử lại.</p>
            )}
          </div>
        )}

        {/* Attendance Tab (Quản lý chấm công ca làm) */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Header & Sub-tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quản lý nhân sự</p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Điểm danh & Chấm công Ca làm việc</h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setAttendanceSubTab('daily')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      attendanceSubTab === 'daily'
                        ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    📌 Điểm danh hôm nay
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceSubTab('monthly')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      attendanceSubTab === 'monthly'
                        ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    📊 Bảng công tháng
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-tab 1: Daily Roll-Call */}
            {attendanceSubTab === 'daily' && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Tổng nhân viên</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{attendanceSummary?.stats?.totalCollectors || 0}</p>
                  </div>
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                    <p className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase mb-1">Đang trong ca làm</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{attendanceSummary?.stats?.inShift || 0}</p>
                  </div>
                  <div className="bg-sky-50/70 dark:bg-sky-950/30 p-5 rounded-2xl border border-sky-100 dark:border-sky-900/50 shadow-sm">
                    <p className="text-sky-700 dark:text-sky-400 text-xs font-bold uppercase mb-1">Đã hoàn thành ca</p>
                    <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{attendanceSummary?.stats?.completedToday || 0}</p>
                  </div>
                  <div className="bg-amber-50/70 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/50 shadow-sm">
                    <p className="text-amber-700 dark:text-amber-400 text-xs font-bold uppercase mb-1">Chưa điểm danh</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{attendanceSummary?.stats?.notCheckedIn || 0}</p>
                  </div>
                </div>

                {/* Filter & Daily Table */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Bảng điểm danh ca làm việc</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Chọn ngày:</span>
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={e => setAttendanceDate(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs px-3 py-1.5"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-300">
                      <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                        <tr>
                          <th className="px-4 py-3">Nhân viên thu gom</th>
                          <th className="px-4 py-3">Số điện thoại</th>
                          <th className="px-4 py-3">Giờ vào ca (Check-in)</th>
                          <th className="px-4 py-3">Giờ ra ca (Check-out)</th>
                          <th className="px-4 py-3">Tổng giờ làm</th>
                          <th className="px-4 py-3">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {loadingAttendance ? (
                          <tr><td colSpan="6" className="py-8 text-center text-slate-400">Đang tải bảng điểm danh...</td></tr>
                        ) : !attendanceSummary?.dailySummary || attendanceSummary.dailySummary.length === 0 ? (
                          <tr><td colSpan="6" className="py-8 text-center text-slate-400">Không có dữ liệu nhân viên.</td></tr>
                        ) : (
                          attendanceSummary.dailySummary.map((item) => (
                            <tr key={item.collector_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                              <td className="px-4 py-4 font-bold text-slate-900 dark:text-white">{item.collector_name}</td>
                              <td className="px-4 py-4 text-slate-500">{item.phone || '--'}</td>
                              <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-300">
                                {item.check_in ? new Date(item.check_in).toLocaleTimeString('vi-VN') : '--:--'}
                              </td>
                              <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-300">
                                {item.check_out ? new Date(item.check_out).toLocaleTimeString('vi-VN') : '--:--'}
                              </td>
                              <td className="px-4 py-4 font-bold text-sky-600 dark:text-sky-400">
                                {item.work_hours ? `${item.work_hours} giờ` : '--'}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                  item.status === 'in_shift' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                                  item.status === 'completed' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300' :
                                  'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                                }`}>
                                  {item.status === 'in_shift' ? '🟢 Đang trong ca' :
                                   item.status === 'completed' ? '🔵 Đã xong ca' : '⚪ Chưa vào ca'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Monthly Timesheet Summary */}
            {attendanceSubTab === 'monthly' && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Bảng tổng hợp công tháng</h3>
                    <p className="text-xs text-slate-400">Thống kê tổng số ngày công và giờ làm thực tế để duyệt lương</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={attendanceMonth}
                      onChange={e => setAttendanceMonth(Number(e.target.value))}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs px-3 py-1.5"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>Tháng {m}</option>
                      ))}
                    </select>
                    <select
                      value={attendanceYear}
                      onChange={e => setAttendanceYear(Number(e.target.value))}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs px-3 py-1.5"
                    >
                      {[2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>Năm {y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                      <tr>
                        <th className="px-4 py-3">Nhân viên thu gom</th>
                        <th className="px-4 py-3">Tổng số ngày công</th>
                        <th className="px-4 py-3">Tổng số giờ làm</th>
                        <th className="px-4 py-3">Đánh giá chuyên cần</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {loadingAttendance ? (
                        <tr><td colSpan="4" className="py-8 text-center text-slate-400">Đang tải bảng công tháng...</td></tr>
                      ) : !attendanceSummary?.monthlyTimesheet || attendanceSummary.monthlyTimesheet.length === 0 ? (
                        <tr><td colSpan="4" className="py-8 text-center text-slate-400">Chưa có dữ liệu bảng công tháng này.</td></tr>
                      ) : (
                        attendanceSummary.monthlyTimesheet.map((row) => (
                          <tr key={row.collector_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="px-4 py-4 font-bold text-slate-900 dark:text-white">{row.collector_name}</td>
                            <td className="px-4 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                              {row.totalDays} ngày công
                            </td>
                            <td className="px-4 py-4 font-bold text-sky-600 dark:text-sky-400">
                              {row.totalHours} giờ
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                row.totalDays >= 20 ? 'bg-emerald-100 text-emerald-800' :
                                row.totalDays >= 10 ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {row.totalDays >= 20 ? '🌟 Chuyên cần tốt' : row.totalDays >= 10 ? '👍 Đạt chỉ tiêu' : '⚠️ Cần cải thiện'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Salaries & Performance Tab */}
        {activeTab === 'salaries' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Salaries Management (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quản lý lương thưởng</p>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lương & Thưởng Nhân Viên</h2>
                    </div>
                    
                    {/* Month/Year selectors */}
                    <div className="flex gap-2">
                      <select 
                        value={salaryMonth} 
                        onChange={(e) => setSalaryMonth(Number(e.target.value))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-805 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>Tháng {m}</option>
                        ))}
                      </select>
                      <select 
                        value={salaryYear} 
                        onChange={(e) => setSalaryYear(Number(e.target.value))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-805 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none"
                      >
                        {[2025, 2026, 2027].map(y => (
                          <option key={y} value={y}>Năm {y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-300 font-medium">
                      <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Nhân viên</th>
                          <th className="px-4 py-3">Lương cơ bản</th>
                          <th className="px-4 py-3">Thưởng</th>
                          <th className="px-4 py-3">Lý do thưởng</th>
                          <th className="px-4 py-3 text-right">Tổng nhận</th>
                          <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {collectors.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">Không có nhân viên thu gom nào.</td>
                          </tr>
                        ) : (
                          collectors.map((collector) => {
                            const salaryRecord = salariesList.find(s => s.collectorId === collector.uid);
                            const baseSalary = salaryRecord ? salaryRecord.baseSalary : 8000000;
                            const bonus = salaryRecord ? salaryRecord.bonus : 0;
                            const reason = salaryRecord ? salaryRecord.bonusReason : '';
                            const total = baseSalary + bonus;

                            return (
                              <tr key={collector.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900/70 transition-colors">
                                <td className="px-4 py-4 font-semibold text-slate-905 dark:text-white">
                                  {collector.fullName}
                                  {!salaryRecord && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                                      Mặc định
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-slate-700 dark:text-slate-300">{baseSalary.toLocaleString('vi-VN')}đ</td>
                                <td className="px-4 py-4 text-emerald-600 font-semibold">
                                  {bonus > 0 ? `+${bonus.toLocaleString('vi-VN')}đ` : '0đ'}
                                </td>
                                <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={reason}>
                                  {reason || '—'}
                                </td>
                                <td className="px-4 py-4 text-right font-bold text-slate-905 dark:text-white">
                                  {total.toLocaleString('vi-VN')}đ
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCollectorSalary(collector);
                                      setSalaryForm({
                                        baseSalary,
                                        bonus,
                                        bonusReason: reason,
                                      });
                                      setShowSalaryForm(true);
                                    }}
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                                  >
                                    Cập nhật
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* Right Column: Team Performance (1 col) */}
              <div className="space-y-6">
                <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                  <div className="mb-6">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Hiệu suất</p>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Bảng Xếp Hạng Đội Nhóm</h2>
                    <p className="text-xs text-slate-400 mt-1">Dựa trên số tuyến hoàn thành trong tháng {salaryMonth}/{salaryYear}</p>
                  </div>

                  <div className="space-y-4">
                    {teamPerformance.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Chưa có dữ liệu hiệu suất đội nhóm.</p>
                    ) : (
                      teamPerformance.map((perf, index) => (
                        <div key={perf.teamId} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{perf.teamName}</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                              {perf.completionRate}%
                            </span>
                          </div>
                          
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${perf.completionRate}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-[10px] text-slate-450">
                            <span>{perf.members.length} thành viên</span>
                            <span>{perf.completedRoutes}/{perf.totalRoutes} tuyến hoàn thành</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

            </div>

            {/* Set Salary Modal */}
            {showSalaryForm && selectedCollectorSalary && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSalaryForm(false)}>
                <div 
                  className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <form onSubmit={handleSetSalary}>
                    <div className="border-b border-slate-100 dark:border-slate-700 p-6 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thiết lập Lương & Thưởng</h3>
                        <p className="text-xs text-slate-500 mt-1">Cập nhật thông tin cho {selectedCollectorSalary.fullName}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowSalaryForm(false)}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl text-xs space-y-1">
                        <p className="text-slate-400">Nhân viên: <span className="font-bold text-slate-800 dark:text-white">{selectedCollectorSalary.fullName}</span></p>
                        <p className="text-slate-400">Áp dụng: <span className="font-bold text-slate-800 dark:text-white">Tháng {salaryMonth}/{salaryYear}</span></p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lương cơ bản (VND)</label>
                        <input
                          type="number"
                          required
                          value={salaryForm.baseSalary}
                          onChange={(e) => setSalaryForm(prev => ({ ...prev, baseSalary: e.target.value }))}
                          className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                          placeholder="8000000"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Thưởng thêm (VND)</label>
                        <input
                          type="number"
                          value={salaryForm.bonus}
                          onChange={(e) => setSalaryForm(prev => ({ ...prev, bonus: e.target.value }))}
                          className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lý do thưởng</label>
                        <textarea
                          rows={3}
                          value={salaryForm.bonusReason}
                          onChange={(e) => setSalaryForm(prev => ({ ...prev, bonusReason: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none"
                          placeholder="VD: Đi nhiều tuyến nhất tuần, hoàn thành xuất sắc..."
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 p-4 flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowSalaryForm(false)}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={managerLoading}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {managerLoading ? 'Đang lưu...' : 'Lưu lại'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Work Tab (Schedules + Route/Team management) */}
        {activeTab === 'work' && (
        <div className="space-y-6">
        <div className={`grid grid-cols-1 ${normalizeRole(user.role) !== ROLES.ADMIN ? 'lg:grid-cols-3' : ''} gap-6`}>
          {normalizeRole(user.role) !== ROLES.ADMIN && (
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

                {/* Mode toggle */}
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl w-fit">
                  {[{ id: 'week', label: 'Cả tuần (đội)' }, { id: 'single', label: 'Một ngày' }].map(m => (
                    <button key={m.id} type="button" onClick={() => setScheduleMode(m.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${scheduleMode === m.id ? 'bg-white dark:bg-slate-800 shadow text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Tuyến thu gom <span className="text-rose-500">*</span></span>
                    <select
                      name="routeId"
                      value={newSchedule.routeId}
                      onChange={(e) => {
                         const val = e.target.value;
                         setNewSchedule(prev => ({ ...prev, routeId: val }));
                         const routeObj = routes.find(r => r.id === val);
                         if (routeObj && routeObj.route_points) {
                           setRoutePoints(sanitizeRoutePoints(routeObj.route_points));
                         }
                      }}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="">-- Chọn Tuyến --</option>
                      {routes.map(r => (
                        <option key={r.id} value={r.id}>{r.route_name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Loại dịch vụ</span>
                    <select
                      name="serviceType"
                      value={newSchedule.serviceType}
                      onChange={(e) => setNewSchedule(prev => ({...prev, serviceType: e.target.value}))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="Recycling">Recycling</option>
                      <option value="Organic">Organic</option>
                      <option value="General">General</option>
                    </select>
                  </label>
                </div>

                {/* Date selection: week mode or single day */}
                {scheduleMode === 'week' ? (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Chọn ngày (Tự động áp dụng tuần)</span>
                      <input
                        type="date"
                        value={newSchedule.date || weekStartDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          setNewSchedule(prev => ({ ...prev, date: val }));
                          const monday = getMondayOfWeek(val);
                          setWeekStartDate(monday);
                        }}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </label>
                    <div>
                      <span className="text-sm text-slate-600 dark:text-slate-300 block mb-2">Ngày trong tuần <span className="text-rose-500">*</span></span>
                      <div className="flex flex-wrap gap-2">
                        {DAY_LABELS.map((label, i) => {
                          const dayNum = i + 1;
                          const checked = selectedDays.includes(dayNum);
                          const dateStr = getDateForDayOffset(weekStartDate, i);
                          const formattedDate = dateStr ? `${dateStr.slice(8)}/${dateStr.slice(5, 7)}` : '';
                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => setSelectedDays(prev => checked ? prev.filter(d => d !== dayNum) : [...prev, dayNum].sort())}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                                checked
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                              }`}
                            >
                              {label}<br />
                              <span className="font-normal opacity-90 text-[11px]">{formattedDate}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Ngày</span>
                      <input type="date" name="date" min={new Date().toISOString().split('T')[0]} value={newSchedule.date}
                        onChange={(e) => setNewSchedule(prev => ({...prev, date: e.target.value}))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Giờ</span>
                      <input type="time" name="time" value={newSchedule.time}
                        onChange={(e) => setNewSchedule(prev => ({...prev, time: e.target.value}))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                    </label>
                  </div>
                )}

                {/* Time + assignment type row */}
                <div className="grid gap-4 md:grid-cols-3">
                  {scheduleMode === 'week' && (
                    <label className="block">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Giờ bắt đầu</span>
                      <input type="time" value={newSchedule.time}
                        onChange={(e) => setNewSchedule(prev => ({...prev, time: e.target.value}))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                    </label>
                  )}
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Phân công cho</span>
                    <select name="assignedType" value={newSchedule.assignedType}
                      onChange={(e) => setNewSchedule(prev => ({...prev, assignedType: e.target.value}))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                      <option value="team">Đội nhóm</option>
                      <option value="solo">Cá nhân</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Tỉnh/Thành</span>
                    <select
                      name="province"
                      value={selectedProvince}
                      onChange={handleProvinceChange}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="">-- Chọn tỉnh/thành --</option>
                      {provinces.map((province) => (
                        <option key={province.code} value={province.code}>{province.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Phường/Xã</span>
                    <select
                      name="ward"
                      value={selectedWard}
                      onChange={handleWardChange}
                      disabled={!selectedProvince || loadingWards}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="">-- Chọn phường/xã --</option>
                      {wards.map((ward) => (
                        <option key={ward.code} value={ward.code}>{ward.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {newSchedule.assignedType === 'solo' ? (
                    <label className="block">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Nhân viên thu gom</span>
                      <select
                        name="assignedCollector"
                        value={newSchedule.assignedCollector}
                        onChange={(e) => setNewSchedule(prev => ({...prev, assignedCollector: e.target.value}))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">-- Chọn cá nhân --</option>
                        {collectors.map(c => (
                          <option key={c.uid} value={c.uid}>{c.fullName}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="block">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Đội nhóm</span>
                      <select
                        name="teamId"
                        value={newSchedule.teamId}
                        onChange={(e) => setNewSchedule(prev => ({...prev, teamId: e.target.value}))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">-- Chọn đội nhóm --</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.team_name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Xe thu gom (Tùy chọn)</span>
                    <input
                      name="assignedTruck"
                      value={newSchedule.assignedTruck}
                      onChange={(e) => setNewSchedule(prev => ({...prev, assignedTruck: e.target.value}))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="TRUCK-402"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Tài xế (Tùy chọn)</span>
                    <select
                      name="assignedDriver"
                      value={newSchedule.assignedDriver}
                      onChange={(e) => setNewSchedule(prev => ({...prev, assignedDriver: e.target.value}))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="">-- Chọn tài xế từ danh sách Nhân viên --</option>
                      {collectors.map((c) => (
                        <option key={c.uid} value={c.fullName}>
                          {c.fullName} {c.phone ? `(${c.phone})` : c.email ? `(${c.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Ghi chú</span>
                    <input
                      name="notes"
                      value={newSchedule.notes}
                      onChange={(e) => setNewSchedule(prev => ({...prev, notes: e.target.value}))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="Thông tin thêm..."
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

            <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-0 shadow-sm">
              <CollectionRouteMap
                title={assignment.scheduleId ? 'Route Planner' : 'Route Map'}
                collectorName={assignment.assignedCollector || 'Chưa gán'}
                routePoints={routePoints}
                setRoutePoints={setRoutePoints}
                readOnly={isAssignmentLocked}
              />
            </section>

            <RouteManager
              routes={routes}
              refreshRoutes={fetchRoutes}
              managerLoading={managerLoading}
              setManagerLoading={setManagerLoading}
              setManagerError={setManagerError}
            />

          </div>
          )}

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
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Xác nhận thu gom</p>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tuyến chờ xác nhận</h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {completionPending.length} tuyến
                </span>
              </div>

              {completionGroups.filter((g) => g.canApproveDay).length > 0 && (
                <div className="mb-4 space-y-2">
                  {completionGroups.filter((g) => g.canApproveDay).slice(0, 3).map((group) => (
                    <div key={group.date} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                          Ngày {formatDate(`${group.date}T12:00:00`)}
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          {group.pending} tuyến chờ · {group.activeTotal} tuyến hoàn thành
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={managerLoading}
                        onClick={() => handleApproveDay(group.date)}
                        className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Xác nhận cả ngày
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {completionPending.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-4 text-sm text-slate-500 dark:text-slate-400">
                    Không có tuyến chờ xác nhận.
                  </div>
                ) : (
                  completionPending.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-amber-200 dark:border-amber-900/50 p-4 bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{item.route_name || 'Tuyến'}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(item.schedule_date)} · {item.assigned_collector || 'Chưa gán'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => { setViewingCompletion(item); setRejectCompletionNote(''); }}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                          >
                            Xem minh chứng
                          </button>
                          <button
                            type="button"
                            disabled={managerLoading}
                            onClick={() => handleApproveCompletion(item.id)}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Xác nhận
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </aside>
        </div>

        {/* Collection schedule list section (Quản lý lịch) */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex flex-col gap-4 mb-6">
            {/* Row 1: Tiêu đề + Nút toggle view */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quản lý lịch</p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {scheduleViewMode === 'monthgrid' ? 'Lịch tháng tổng quan' : scheduleViewMode === 'calendar' ? 'Lịch theo Đội nhóm & Ngày' : 'Bảng danh sách lịch'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setScheduleViewMode('monthgrid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      scheduleViewMode === 'monthgrid'
                        ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">grid_view</span>
                    Lịch tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleViewMode('calendar')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      scheduleViewMode === 'calendar'
                        ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                    Theo ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      scheduleViewMode === 'table'
                        ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">format_list_bulleted</span>
                    Bảng
                  </button>
                </div>
                <button
                  type="button"
                  onClick={loadManagerData}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 shrink-0"
                >
                  Làm mới
                </button>
              </div>
            </div>

            {/* Row 2: Bộ lọc tháng/năm + đội */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lọc:</span>
              {/* Tháng/Năm navigation */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
                    else setCalendarMonth(m => m - 1);
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition text-slate-600 dark:text-slate-300"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="text-sm font-bold text-slate-800 dark:text-white px-2 min-w-[90px] text-center">
                  Tháng {calendarMonth + 1}/{calendarYear}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
                    else setCalendarMonth(m => m + 1);
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition text-slate-600 dark:text-slate-300"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setCalendarMonth(new Date().getMonth()); setCalendarYear(new Date().getFullYear()); }}
                  className="ml-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/60 transition"
                >
                  Hôm nay
                </button>
              </div>
              {/* Lọc đội */}
              <select
                value={scheduleTeamFilter}
                onChange={e => setScheduleTeamFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="all">Tất cả đội</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.team_name}</option>
                ))}
              </select>
              {/* Số lịch tìm thấy */}
              <span className="ml-auto text-xs text-slate-400">
                {schedules.filter(s => {
                  const d = s.schedule_date ? new Date(s.schedule_date) : null;
                  const monthMatch = !d ? false : (d.getMonth() === calendarMonth && d.getFullYear() === calendarYear);
                  const teamMatch = scheduleTeamFilter === 'all' || s.team_id === scheduleTeamFilter;
                  return monthMatch && teamMatch;
                }).length} lịch trong tháng
              </span>
            </div>
          </div>

          {/* CHẾ ĐỘ 0: LỊCH THÁNG DẠNG GRID (MONTH GRID VIEW) */}
          {scheduleViewMode === 'monthgrid' && (() => {
            const DAYS_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const firstDay = new Date(calendarYear, calendarMonth, 1);
            const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
            const startDow = firstDay.getDay(); // 0=Sun
            const totalDays = lastDay.getDate();
            const todayDate = new Date();
            const todayKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth()+1).padStart(2,'0')}-${String(todayDate.getDate()).padStart(2,'0')}`;

            // Build schedulesByDay map: { 'YYYY-MM-DD': [schedules] }
            const schedulesByDay = {};
            schedules.forEach(s => {
              if (!s.schedule_date) return;
              const d = new Date(s.schedule_date);
              if (isNaN(d.getTime())) return;
              if (d.getMonth() !== calendarMonth || d.getFullYear() !== calendarYear) return;
              if (scheduleTeamFilter !== 'all' && s.team_id !== scheduleTeamFilter) return;
              const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              if (!schedulesByDay[key]) schedulesByDay[key] = [];
              schedulesByDay[key].push(s);
            });

            // Build calendar cells: leading empty + day cells + trailing empty
            const cells = [];
            for (let i = 0; i < startDow; i++) cells.push(null);
            for (let d = 1; d <= totalDays; d++) cells.push(d);
            while (cells.length % 7 !== 0) cells.push(null);

            return (
              <div>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAYS_LABEL.map(d => (
                    <div key={d} className={`text-center text-[11px] font-extrabold uppercase tracking-wider py-2 ${
                      d === 'CN' ? 'text-rose-500' : d === 'T7' ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'
                    }`}>{d}</div>
                  ))}
                </div>
                {/* Calendar cells */}
                <div className="grid grid-cols-7 gap-1.5">
                  {cells.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="h-24 rounded-2xl" />;
                    const dateKey = `${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const daySchedules = schedulesByDay[dateKey] || [];
                    const isToday = dateKey === todayKey;
                    const hasPending = daySchedules.some(s => (s.status||'').toLowerCase() === 'completed_pending_approval');
                    const hasIncident = daySchedules.some(s => s.incident);
                    const dow = (startDow + day - 1) % 7;
                    const isSun = dow === 0;
                    const isSat = dow === 6;

                    return (
                      <div
                        key={dateKey}
                        className={`relative h-24 rounded-2xl border p-1.5 flex flex-col gap-0.5 transition-all cursor-pointer group
                          ${ isToday
                            ? 'border-sky-400 bg-sky-50/80 dark:bg-sky-950/40 shadow-md ring-2 ring-sky-300/40'
                            : daySchedules.length > 0
                              ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 hover:shadow-md'
                              : 'border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20'
                          }`}
                        onClick={() => {
                          if (daySchedules.length > 0) {
                            // Tạo group detail từ ngày này
                            const grouped = {};
                            daySchedules.forEach(s => {
                              let tn = 'Cá nhân';
                              if (s.team_id) { const ft = teams.find(t => t.id === s.team_id); tn = ft ? ft.team_name : `Đội ${s.team_id}`; }
                              if (!grouped[tn]) grouped[tn] = [];
                              grouped[tn].push(s);
                            });
                            // Open first team detail or show all
                            const firstTeam = Object.keys(grouped)[0];
                            setViewingGroupDetail({ dateStr: dateKey, teamName: firstTeam, scheduleList: grouped[firstTeam], allGroups: grouped });
                          }
                        }}
                      >
                        {/* Số ngày */}
                        <span className={`text-xs font-bold self-start px-1.5 py-0.5 rounded-lg ${
                          isToday ? 'bg-sky-500 text-white' :
                          isSun ? 'text-rose-500 dark:text-rose-400' :
                          isSat ? 'text-orange-500 dark:text-orange-400' :
                          'text-slate-700 dark:text-slate-200'
                        }`}>{day}</span>

                        {/* Schedules dots / badges */}
                        {daySchedules.length > 0 && (() => {
                          const groupedInCell = {};
                          daySchedules.forEach(s => {
                            let tn = 'Cá nhân';
                            if (s.team_id) { const ft = teams.find(t => t.id === s.team_id); tn = ft ? ft.team_name : `Đội ${s.team_id}`; }
                            if (!groupedInCell[tn]) groupedInCell[tn] = [];
                            groupedInCell[tn].push(s);
                          });
                          const teamEntries = Object.entries(groupedInCell);

                          return (
                            <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                              {teamEntries.slice(0, 2).map(([tName, list]) => (
                                <span
                                  key={tName}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingGroupDetail({ dateStr: dateKey, teamName: tName, scheduleList: list, allGroups: groupedInCell });
                                  }}
                                  className="text-[9px] font-semibold px-1 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900 truncate leading-tight transition-colors"
                                  title={`Bấm xem đội ${tName}`}
                                >
                                  {tName} ({list.length})
                                </span>
                              ))}
                              {teamEntries.length > 2 && (
                                <span className="text-[9px] text-slate-400 pl-1">+{teamEntries.length - 2} đội nữa</span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Status indicators */}
                        <div className="flex items-center gap-1 mt-auto">
                          {hasIncident && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Có sự cố" />}
                          {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Chờ duyệt" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"/> Hôm nay</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"/> Có sự cố</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Chờ duyệt</span>
                  <span className="ml-auto text-slate-400">Bấm vào ngày có lịch để xem chi tiết</span>
                </div>
              </div>
            );
          })()}

          {/* CHẾ ĐỘ 1: LỊCH THEO ĐỘI NHÓM & NGÀY (CALENDAR VIEW) */}
          {scheduleViewMode === 'calendar' && (
            <div className="space-y-6">
              {(() => {
                // FIX: Normalize schedule_date về YYYY-MM-DD để tránh lặp ngày do ISO timestamp khác nhau
                const dateMap = {};
                schedules.forEach((s) => {
                  // Filter theo tháng/năm + đội
                  if (s.schedule_date) {
                    const d = new Date(s.schedule_date);
                    if (!isNaN(d.getTime())) {
                      if (d.getMonth() !== calendarMonth || d.getFullYear() !== calendarYear) return;
                    }
                  }
                  if (scheduleTeamFilter !== 'all' && s.team_id !== scheduleTeamFilter) return;

                  // Normalize dateKey về YYYY-MM-DD
                  let dateKey = 'Chưa xếp ngày';
                  if (s.schedule_date) {
                    const d = new Date(s.schedule_date);
                    if (!isNaN(d.getTime())) {
                      dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    } else if (typeof s.schedule_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.schedule_date)) {
                      dateKey = s.schedule_date;
                    }
                  }

                  if (!dateMap[dateKey]) dateMap[dateKey] = {};

                  let teamName = 'Cá nhân';
                  if (s.team_id) {
                    const foundTeam = teams.find((t) => t.id === s.team_id);
                    teamName = foundTeam ? foundTeam.team_name : `Đội ${s.team_id}`;
                  } else if (s.assigned_collectors && s.assigned_collectors.length > 0) {
                    teamName = s.assigned_collectors.map((c) => c.name).join(', ');
                  }

                  if (!dateMap[dateKey][teamName]) dateMap[dateKey][teamName] = [];
                  dateMap[dateKey][teamName].push(s);
                });

                const sortedDates = Object.keys(dateMap).sort();
                const todayStr = toLocalDateString(new Date());

                if (sortedDates.length === 0) {
                  return (
                    <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-sm">
                      Chưa có lịch thu gom nào được khởi tạo.
                    </div>
                  );
                }

                return sortedDates.map((dateStr) => {
                  const teamsInDate = dateMap[dateStr];
                  const isToday = dateStr === todayStr;
                  // Tính thứ trong tuần
                  const dateObj = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(dateStr + 'T12:00:00') : null;
                  const dowLabel = dateObj ? ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][dateObj.getDay()] : '';

                  return (
                    <div key={dateStr} className={`rounded-2xl border p-5 space-y-4 ${ isToday ? 'border-sky-300 bg-sky-50/60 dark:border-sky-700/60 dark:bg-sky-950/20' : 'border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30' }`}>
                      {/* Tiêu đề Ngày */}
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sky-600 dark:text-sky-400">calendar_today</span>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {dowLabel && <span className="text-sky-600 dark:text-sky-400 mr-1">{dowLabel},</span>}
                            Ngày {formatDate(dateStr + 'T12:00:00')}
                          </h3>
                          {isToday && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                              Hôm nay
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {Object.keys(teamsInDate).length} Đội/Nhân viên hoạt động
                        </span>
                      </div>

                      {/* Lưới Thẻ Đội Nhóm trong Ngày */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(teamsInDate).map(([teamName, scheduleList]) => {
                          const hasIncident = scheduleList.some((s) => s.incident);
                          const isPendingApproval = scheduleList.some((s) => (s.status || '').toLowerCase() === 'completed_pending_approval');
                          const truckName = scheduleList[0]?.assigned_truck || 'Chưa gán xe';

                          return (
                            <div
                              key={teamName}
                              onClick={() => setViewingGroupDetail({ dateStr, teamName, scheduleList, allGroups: teamsInDate })}
                              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 shadow-sm hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group"
                            >
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 text-xs font-bold mb-1">
                                    👥 {teamName}
                                  </span>
                                  <p className="text-xs text-slate-400">🚚 Xe: <span className="font-semibold text-slate-700 dark:text-slate-300">{truckName}</span></p>
                                </div>
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-sky-500 transition-colors">chevron_right</span>
                              </div>

                              <div className="space-y-1.5">
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                  📌 <span className="font-bold text-slate-900 dark:text-white">{scheduleList.length} tuyến</span> thu gom:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {scheduleList.map((s) => (
                                    <span key={s.id} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                                      {s.route_name || 'Tuyến'}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Cảnh báo & Trạng thái */}
                              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                                {hasIncident ? (
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">warning</span> Có sự cố
                                  </span>
                                ) : isPendingApproval ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">verified</span> Chờ duyệt
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Bấm xem chi tiết...</span>
                                )}
                                <span className="text-sky-600 dark:text-sky-400 font-semibold group-hover:underline">Chi tiết ➔</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* CHẾ ĐỘ 2: BẢNG DANH SÁCH CHI TIẾT (TABLE VIEW) */}
          {scheduleViewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Tuyến</th>
                    <th className="px-4 py-3">Ngày giờ</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Xe</th>
                    <th className="px-4 py-3">Phân công</th>
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
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(schedule.schedule_date)} · {formatScheduleTime(schedule)}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusBadge(schedule.status)}`}>
                            {formatStatusLabel(schedule.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4">{schedule.assigned_truck || 'Chưa gán'}</td>
                        <td className="px-4 py-4">
                          {schedule.team_id ? (
                            <span className="font-semibold text-sky-600 dark:text-sky-400">
                              Đội: {teams.find(t => t.id === schedule.team_id)?.team_name || schedule.team_id}
                            </span>
                          ) : schedule.assigned_collectors && schedule.assigned_collectors.length > 0 ? (
                            <span className="text-slate-700 dark:text-slate-300">
                              Cá nhân: {schedule.assigned_collectors.map(c => c.name).join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-400">Chưa gán</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(schedule.status || '').toLowerCase() === 'completed_pending_approval' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingCompletion({
                                      id: schedule.id,
                                      route_name: schedule.route_name,
                                      schedule_date: schedule.schedule_date,
                                      assigned_collector: schedule.assigned_collector,
                                      evidence_urls: schedule.evidence_urls || schedule.evidenceUrls || [],
                                    });
                                    setRejectCompletionNote('');
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                                >
                                  <span className="material-symbols-outlined text-sm">image</span>
                                  Minh chứng
                                </button>
                                <button
                                  type="button"
                                  disabled={managerLoading}
                                  onClick={() => handleApproveCompletion(schedule.id)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Xác nhận
                                </button>
                              </>
                            )}
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
          )}
        </section>
        </div>
        )}

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. Duyệt kết quả (Phản ánh chờ duyệt) */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Duyệt kết quả</p>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Phản ánh chờ duyệt</h2>
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full">
                  {feedbackReports.filter((r) => ['resolved_pending_approval', 'resolved'].includes((r.status || '').toLowerCase())).length} chờ duyệt
                </span>
              </div>
              <div className="space-y-4">
                {feedbackReports.filter((r) => ['resolved_pending_approval', 'resolved'].includes((r.status || '').toLowerCase())).length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                    Không có phản ánh nào đang chờ duyệt.
                  </div>
                ) : (
                  feedbackReports
                    .filter((r) => ['resolved_pending_approval', 'resolved'].includes((r.status || '').toLowerCase()))
                    .slice(0, 10)
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
                            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-emerald-500 transition-colors"
                          >
                            Duyệt
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* 2. Tóm tắt phản ánh bằng AI */}
            <AIComplaintSummary />

            {/* 3. Quản lý Phản ánh & Sự cố môi trường */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quản lý Phản ánh & Sự cố</p>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Phản ánh & Sự cố môi trường</h2>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{complaints.length} phản ánh</span>
              </div>

              {/* Status filter tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
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
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
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

              <div className="space-y-3">
                {(() => {
                  const filtered = complaintFilter === 'all'
                    ? complaints
                    : complaints.filter((c) => (c.status || 'Open').toLowerCase() === complaintFilter.toLowerCase());
                  if (filtered.length === 0) {
                    return (
                      <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                        Không có phản ánh nào trong danh mục này.
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
                            <p className="font-semibold text-slate-900 dark:text-white text-base truncate">{item.title || 'Phản ánh mới'}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {item.userName || 'Cư dân'} · {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : ''}
                            </p>
                          </div>
                          <span className={`shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{item.description || 'Không có nội dung chi tiết.'}</p>
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
          </div>
        )}

        {/* Quản lý Collector Tab */}
        {activeTab === 'collectors' && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. Thống kê theo khu vực */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 mb-2">Thống kê khu vực</p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Nhân sự theo Địa bàn</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(
                  collectors.reduce((acc, c) => {
                    const area = c.ward || c.district || c.area || 'Chưa thiết lập';
                    acc[area] = (acc[area] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([area, count]) => (
                  <div key={area} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    <span className="text-sm font-semibold">{area}:</span>
                    <span className="text-sm font-bold bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Quản lý Đội Nhóm (Nằm TRÊN Danh sách Nhân viên thu gom) */}
            <TeamManager
              teams={teams}
              collectors={collectors}
              refreshTeams={fetchTeams}
              managerLoading={managerLoading}
              setManagerLoading={setManagerLoading}
              setManagerError={setManagerError}
            />

            {/* 3. Danh sách Nhân viên thu gom */}
            <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Chi tiết nhân sự</p>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Danh sách Nhân viên thu gom</h2>
                </div>

                {/* Thanh Lọc & Tìm kiếm */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {/* Ô tìm kiếm */}
                  <div className="relative shrink-0">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input
                      type="text"
                      placeholder="Tìm tên, email, SĐT..."
                      value={collectorSearchText}
                      onChange={(e) => setCollectorSearchText(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:border-sky-400 w-44 sm:w-52"
                    />
                  </div>

                  {/* Lọc theo Khu vực */}
                  <select
                    value={collectorAreaFilter}
                    onChange={(e) => setCollectorAreaFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:border-sky-400 cursor-pointer font-medium"
                  >
                    <option value="all">Tất cả khu vực</option>
                    {Array.from(new Set(collectors.map(c => c.ward || c.district || c.area || 'Chưa thiết lập'))).map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>

                  {/* Lọc theo Đội nhóm */}
                  <select
                    value={collectorTeamFilter}
                    onChange={(e) => setCollectorTeamFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:border-sky-400 cursor-pointer font-medium"
                  >
                    <option value="all">Tất cả đội nhóm</option>
                    <option value="none">Chưa tham gia nhóm</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.team_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-300 font-medium">
                  <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Họ tên</th>
                      <th className="px-4 py-3">Email / SĐT</th>
                      <th className="px-4 py-3">Khu vực phụ trách</th>
                      <th className="px-4 py-3">Đội nhóm (Team)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {(() => {
                      const filteredCollectors = collectors.filter(col => {
                        const area = col.ward || col.district || col.area || 'Chưa thiết lập';
                        const team = teams.find(t => (t.members || []).some(m => m.id === col.uid));

                        // 1. Tìm kiếm theo từ khóa
                        if (collectorSearchText.trim()) {
                          const q = collectorSearchText.toLowerCase();
                          const matchName = (col.fullName || '').toLowerCase().includes(q);
                          const matchEmail = (col.email || '').toLowerCase().includes(q);
                          const matchPhone = (col.phone || '').toLowerCase().includes(q);
                          if (!matchName && !matchEmail && !matchPhone) return false;
                        }

                        // 2. Lọc theo khu vực
                        if (collectorAreaFilter !== 'all' && area !== collectorAreaFilter) {
                          return false;
                        }

                        // 3. Lọc theo đội nhóm
                        if (collectorTeamFilter === 'none') {
                          if (team) return false;
                        } else if (collectorTeamFilter !== 'all') {
                          if (!team || team.id !== collectorTeamFilter) return false;
                        }

                        return true;
                      });

                      if (filteredCollectors.length === 0) {
                        return (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                              Không tìm thấy nhân viên thu gom nào phù hợp với bộ lọc.
                            </td>
                          </tr>
                        );
                      }

                      return filteredCollectors.map((col) => {
                        const area = col.ward || col.district || col.area || 'Chưa thiết lập';
                        const team = teams.find(t => (t.members || []).some(m => m.id === col.uid));
                        const teamName = team ? team.team_name : 'Chưa tham gia nhóm';

                        return (
                          <tr key={col.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">
                              {col.fullName}
                            </td>
                            <td className="px-4 py-4 text-xs">
                              <div className="text-slate-900 dark:text-white">{col.email}</div>
                              <div className="text-slate-400">{col.phone || '—'}</div>
                            </td>
                            <td className="px-4 py-4 text-slate-600 dark:text-slate-300 text-xs">
                              {area}
                            </td>
                            <td className="px-4 py-4 text-xs">
                              <span className={`px-2.5 py-1 rounded-full font-bold ${team ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'}`}>
                                {teamName}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

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

        {viewingCompletion && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => { setViewingCompletion(null); setRejectCompletionNote(''); }}>
            <div
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-100 dark:border-slate-700 p-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                      <span className="material-symbols-outlined text-lg">task_alt</span>
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Minh chứng hoàn thành</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Tuyến: {viewingCompletion.route_name || 'Không xác định'} · {formatDate(viewingCompletion.schedule_date)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setViewingCompletion(null); setRejectCompletionNote(''); }}
                  className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Collector</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {viewingCompletion.assigned_collector && viewingCompletion.assigned_collector !== 'Chưa gán'
                      ? viewingCompletion.assigned_collector
                      : Array.isArray(viewingCompletion.assignedCollectors) && viewingCompletion.assignedCollectors.length > 0
                      ? viewingCompletion.assignedCollectors.map(c => typeof c === 'string' ? c : c.name || c.fullName || c.id).join(', ')
                      : viewingCompletion.teamId
                      ? `Đội nhóm (${viewingCompletion.teamId})`
                      : 'Chưa gán'}
                  </p>
                </div>

                {viewingCompletion.evidence_urls && viewingCompletion.evidence_urls.length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white mb-3">
                      Ảnh minh chứng ({viewingCompletion.evidence_urls.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {viewingCompletion.evidence_urls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
                        >
                          <img src={url} alt={`Minh chứng ${idx + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 text-sm text-slate-500 text-center">
                    Không có ảnh minh chứng.
                  </div>
                )}

                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-300">Lý do từ chối (nếu cần)</label>
                  <textarea
                    value={rejectCompletionNote}
                    onChange={(e) => setRejectCompletionNote(e.target.value)}
                    rows={3}
                    placeholder="Nhập lý do nếu từ chối xác nhận..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 p-4 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setViewingCompletion(null); setRejectCompletionNote(''); }}
                  className="rounded-xl border px-5 py-2.5 text-sm font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={managerLoading}
                  onClick={() => handleRejectCompletion(viewingCompletion.id)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 disabled:opacity-50"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  disabled={managerLoading}
                  onClick={() => handleApproveCompletion(viewingCompletion.id)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Xác nhận hoàn thành
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

        {/* Modal Chi Tiết Đội Nhóm Trong Ngày (Cho Calendar View) */}
        {viewingGroupDetail && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setViewingGroupDetail(null)}>
            <div
              ref={groupDetailModalRef}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-100 dark:border-slate-700 p-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                      <span className="material-symbols-outlined text-lg">group</span>
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewingGroupDetail.teamName}</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Lịch hoạt động ngày: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(viewingGroupDetail.dateStr)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingGroupDetail(null)}
                  className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* 🔄 Thanh chuyển đổi giữa các Đội trong ngày (khi ngày đó có nhiều hơn 1 đội hoạt động) */}
                {viewingGroupDetail.allGroups && Object.keys(viewingGroupDetail.allGroups).length > 1 && (
                  <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                      🏢 Các đội hoạt động trong ngày ({Object.keys(viewingGroupDetail.allGroups).length} đội):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(viewingGroupDetail.allGroups).map(([tName, sList]) => {
                        const isActive = viewingGroupDetail.teamName === tName;
                        return (
                          <button
                            key={tName}
                            type="button"
                            onClick={() => setViewingGroupDetail(prev => ({
                              ...prev,
                              teamName: tName,
                              scheduleList: sList
                            }))}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isActive
                                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-300 dark:ring-sky-500'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-sky-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span>👥 {tName}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                              {sList.length} tuyến
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Thông tin Xe & Tuyến */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Phương tiện gán</p>
                    <p className="font-bold text-slate-800 dark:text-white mt-0.5">🚚 {viewingGroupDetail.scheduleList[0]?.assigned_truck || 'Chưa gán xe'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Tổng số tuyến</p>
                    <p className="font-bold text-sky-600 dark:text-sky-400 mt-0.5">{viewingGroupDetail.scheduleList.length} tuyến thu gom</p>
                  </div>
                </div>

                {/* 👥 1. DANH SÁCH THÀNH VIÊN TRONG ĐỘI */}
                {(() => {
                  const currentTeamObj = teams.find(
                    (t) => t.id === viewingGroupDetail.scheduleList[0]?.team_id || t.team_name === viewingGroupDetail.teamName
                  );
                  const teamMembers = currentTeamObj?.members || [];

                  return (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        👥 Thành viên trong Đội ({teamMembers.length}):
                      </p>
                      {teamMembers.length === 0 ? (
                        <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl">
                          Chưa có thông tin danh sách thành viên cụ thể.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {teamMembers.map((m, idx) => {
                            const collectorObj = collectors.find((c) => c.uid === m.id || c.fullName === m.name);
                            const phone = collectorObj?.phone || collectorObj?.email || 'Chưa có SĐT';
                            return (
                              <div
                                key={m.id || idx}
                                className="flex items-center gap-2 bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 p-2.5 rounded-xl text-xs"
                              >
                                <span className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                  {(m.name || 'C')[0].toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 dark:text-white truncate">{m.name}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{phone}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 🗺️ 2. DANH SÁCH TUYẾN KÈM NÚT XEM BẢN ĐỒ LỘ TRÌNH */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Danh sách tuyến trong ngày:</p>
                  {viewingGroupDetail.scheduleList.map((schedule) => (
                    <div key={schedule.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-white text-base">{schedule.route_name || 'Tuyến thu gom'}</p>
                            {schedule.incident && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                <span className="material-symbols-outlined text-xs">warning</span> Sự cố
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Giờ chạy: {formatScheduleTime(schedule)}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(schedule.status)}`}>
                          {formatStatusLabel(schedule.status)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        {/* Nút Xem Bản Đồ Lộ Trình */}
                        <button
                          type="button"
                          onClick={() => setViewingRouteMapSchedule(schedule)}
                          className="inline-flex items-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                        >
                          <span className="material-symbols-outlined text-sm">map</span> Xem lộ trình
                        </button>

                        {(schedule.status || '').toLowerCase() === 'completed_pending_approval' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setViewingCompletion({
                                  id: schedule.id,
                                  route_name: schedule.route_name,
                                  schedule_date: schedule.schedule_date,
                                  assigned_collector: schedule.assigned_collector,
                                  evidence_urls: schedule.evidence_urls || schedule.evidenceUrls || [],
                                });
                                setRejectCompletionNote('');
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                            >
                              <span className="material-symbols-outlined text-sm">image</span> Minh chứng
                            </button>
                            <button
                              type="button"
                              disabled={managerLoading}
                              onClick={() => handleApproveCompletion(schedule.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Xác nhận
                            </button>
                          </>
                        )}
                        {schedule.incident && (
                          <button
                            type="button"
                            onClick={() => setViewingIncident(schedule)}
                            className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span> Xem sự cố
                          </button>
                        )}
                        {!schedule.collector_confirmed && (
                          <button
                            type="button"
                            disabled={managerLoading}
                            onClick={() => {
                              handleDeleteSchedule(schedule.id, schedule.route_name);
                              setViewingGroupDetail(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span> Xóa tuyến
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 p-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingGroupDetail(null)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xem Bản Đồ Lộ Trình (Leaflet Map Modal) */}
        {viewingRouteMapSchedule && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4" onClick={() => setViewingRouteMapSchedule(null)}>
            <div
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-100 dark:border-slate-700 p-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <span className="material-symbols-outlined text-lg">map</span>
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Bản đồ Lộ trình: {viewingRouteMapSchedule.route_name || 'Tuyến thu gom'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ngày chạy: {formatDate(viewingRouteMapSchedule.schedule_date)} · Xe: {viewingRouteMapSchedule.assigned_truck || 'Chưa gán'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingRouteMapSchedule(null)}
                  className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <CollectionRouteMap
                  initialRoutePoints={viewingRouteMapSchedule.route_points || routePoints}
                  readOnly={true}
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 p-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingRouteMapSchedule(null)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Đóng bản đồ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

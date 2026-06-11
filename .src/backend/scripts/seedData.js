/**
 * Dữ liệu seed EcoSchedule - Phạm vi: Quận Sơn Trà, Đà Nẵng
 * Firebase Project: swp391-database
 */
const { ROLES } = require('../constants/roles');
const { ts } = require('./seedHelpers');
const {
  PROJECT,
  SON_TRA_WARDS,
  SON_TRA_ROUTE_GROUPS,
  wardAreaId,
  neighborhoodAreaId,
  wardBySlug,
} = require('./sonTraConfig');

const IDS = {
  users: {
    resident: 'user_resident_001',
    resident2: 'user_resident_002',
    collector: 'user_collector_001',
    collector2: 'user_collector_002',
    manager: 'user_manager_001',
    admin: 'user_admin_001',
  },
  company: 'company_001',
  wasteTypes: {
    organic: 'waste_organic',
    recyclable: 'waste_recyclable',
    hazardous: 'waste_hazardous',
    bulky: 'waste_bulky',
  },
  reports: {
    report001: 'report_001',
    report002: 'report_002',
    report003: 'report_003',
  },
  invoices: {
    invoice001: 'invoice_001',
    invoice002: 'invoice_002',
  },
  payments: {
    payment001: 'payment_001',
  },
  notifications: {
    noti001: 'noti_001',
    noti002: 'noti_002',
    noti003: 'noti_003',
  },
  logs: {
    log001: 'log_001',
    log002: 'log_002',
  },
};

const WASTE_TYPE_NAMES = {
  [IDS.wasteTypes.organic]: 'Rác hữu cơ (Sinh hoạt)',
  [IDS.wasteTypes.recyclable]: 'Rác tái chế (Nhựa, kim loại)',
  [IDS.wasteTypes.hazardous]: 'Rác nguy hại (Pin, điện tử)',
  [IDS.wasteTypes.bulky]: 'Rác cồng kềnh (Đồ nội thất cũ)',
};

const AUTH_ACCOUNTS = [
  { uid: IDS.users.resident, email: 'resident@ecoschedule.test', password: 'EcoSchedule@2026', displayName: 'Nguyễn Văn A', role: ROLES.RESIDENT },
  { uid: IDS.users.resident2, email: 'resident2@ecoschedule.test', password: 'EcoSchedule@2026', displayName: 'Hoàng Thị E', role: ROLES.RESIDENT },
  { uid: IDS.users.collector, email: 'collector@ecoschedule.test', password: 'EcoSchedule@2026', displayName: 'Trần Văn B', role: ROLES.COLLECTOR },
  { uid: IDS.users.collector2, email: 'collector2@ecoschedule.test', password: 'EcoSchedule@2026', displayName: 'Phan Văn F', role: ROLES.COLLECTOR },
  { uid: IDS.users.manager, email: 'manager@ecoschedule.test', password: 'EcoSchedule@2026', displayName: 'Lê Thị C', role: ROLES.MANAGER },
  { uid: IDS.users.admin, email: 'admin@ecoschedule.test', password: 'EcoSchedule@2026', displayName: 'Phạm Văn D', role: ROLES.ADMIN },
];

function getWasteTypes() {
  return [
    { _id: IDS.wasteTypes.organic, wasteTypeId: IDS.wasteTypes.organic, name: 'Rác hữu cơ', code: 'ORGANIC', description: 'Rác dễ phân hủy như thức ăn thừa, rau củ.', color: 'green', isActive: true, createdAt: ts('2026-06-01T00:00:00Z') },
    { _id: IDS.wasteTypes.recyclable, wasteTypeId: IDS.wasteTypes.recyclable, name: 'Rác tái chế', code: 'RECYCLABLE', description: 'Nhựa, kim loại, giấy có thể tái chế.', color: 'blue', isActive: true, createdAt: ts('2026-06-01T00:00:00Z') },
    { _id: IDS.wasteTypes.hazardous, wasteTypeId: IDS.wasteTypes.hazardous, name: 'Rác nguy hại', code: 'HAZARDOUS', description: 'Pin, ắc quy, thiết bị điện tử hỏng.', color: 'red', isActive: true, createdAt: ts('2026-06-01T00:00:00Z') },
    { _id: IDS.wasteTypes.bulky, wasteTypeId: IDS.wasteTypes.bulky, name: 'Rác cồng kềnh', code: 'BULKY', description: 'Đồ nội thất cũ, vật dụng lớn.', color: 'orange', isActive: true, createdAt: ts('2026-06-01T00:00:00Z') },
  ];
}

function getAreas() {
  const areas = [
    {
      _id: 'area_city_danang',
      areaId: 'area_city_danang',
      name: PROJECT.city,
      type: 'city',
      parentId: null,
      city: PROJECT.city,
      district: '',
      ward: '',
      isActive: true,
      createdAt: ts('2026-06-01T00:00:00Z'),
    },
    {
      _id: 'area_district_son_tra',
      areaId: 'area_district_son_tra',
      name: PROJECT.district,
      type: 'district',
      parentId: 'area_city_danang',
      city: PROJECT.city,
      district: PROJECT.district,
      ward: '',
      isActive: true,
      createdAt: ts('2026-06-01T00:00:00Z'),
    },
  ];

  SON_TRA_WARDS.forEach((ward) => {
    areas.push({
      _id: wardAreaId(ward.slug),
      areaId: wardAreaId(ward.slug),
      name: ward.name,
      type: 'ward',
      parentId: 'area_district_son_tra',
      city: PROJECT.city,
      district: PROJECT.district,
      ward: ward.name,
      isActive: true,
      createdAt: ts('2026-06-01T00:00:00Z'),
    });

    ward.neighborhoods.forEach((neighborhood) => {
      areas.push({
        _id: neighborhoodAreaId(ward.slug, neighborhood),
        areaId: neighborhoodAreaId(ward.slug, neighborhood),
        name: neighborhood,
        type: 'neighborhood',
        parentId: wardAreaId(ward.slug),
        city: PROJECT.city,
        district: PROJECT.district,
        ward: ward.name,
        isActive: true,
        createdAt: ts('2026-06-01T00:00:00Z'),
      });
    });
  });

  return areas;
}

function getUsers() {
  return [
    {
      _id: IDS.users.resident,
      uid: IDS.users.resident,
      fullName: 'Nguyễn Văn A',
      email: 'resident@ecoschedule.test',
      phone: '0909123456',
      role: ROLES.RESIDENT,
      status: 'active',
      emailVerified: true,
      city: PROJECT.city,
      district: PROJECT.district,
      ward: 'Phường Thọ Quang',
      neighborhood: 'Tổ 12',
      companyId: null,
      createdAt: ts('2026-06-01T08:00:00Z'),
      updatedAt: ts('2026-06-01T08:00:00Z'),
    },
    {
      _id: IDS.users.resident2,
      uid: IDS.users.resident2,
      fullName: 'Hoàng Thị E',
      email: 'resident2@ecoschedule.test',
      phone: '0909567890',
      role: ROLES.RESIDENT,
      status: 'active',
      emailVerified: true,
      city: PROJECT.city,
      district: PROJECT.district,
      ward: 'Phường Phước Mỹ',
      neighborhood: 'Tổ 12',
      companyId: null,
      createdAt: ts('2026-06-01T08:00:00Z'),
      updatedAt: ts('2026-06-01T08:00:00Z'),
    },
    {
      _id: IDS.users.collector,
      uid: IDS.users.collector,
      fullName: 'Trần Văn B',
      email: 'collector@ecoschedule.test',
      phone: '0909234567',
      role: ROLES.COLLECTOR,
      status: 'active',
      emailVerified: true,
      city: PROJECT.city,
      district: PROJECT.district,
      ward: 'Phường Thọ Quang',
      neighborhood: 'Tổ 12',
      companyId: IDS.company,
      createdAt: ts('2026-06-01T08:00:00Z'),
      updatedAt: ts('2026-06-01T08:00:00Z'),
    },
    {
      _id: IDS.users.collector2,
      uid: IDS.users.collector2,
      fullName: 'Phan Văn F',
      email: 'collector2@ecoschedule.test',
      phone: '0909678901',
      role: ROLES.COLLECTOR,
      status: 'active',
      emailVerified: true,
      city: PROJECT.city,
      district: PROJECT.district,
      ward: 'Phường An Hải Bắc',
      neighborhood: 'Tổ 1',
      companyId: IDS.company,
      createdAt: ts('2026-06-01T08:00:00Z'),
      updatedAt: ts('2026-06-01T08:00:00Z'),
    },
    {
      _id: IDS.users.manager,
      uid: IDS.users.manager,
      fullName: 'Lê Thị C',
      email: 'manager@ecoschedule.test',
      phone: '0909345678',
      role: ROLES.MANAGER,
      status: 'active',
      emailVerified: true,
      city: PROJECT.city,
      district: PROJECT.district,
      ward: 'Phường Thọ Quang',
      neighborhood: '',
      companyId: IDS.company,
      createdAt: ts('2026-06-01T08:00:00Z'),
      updatedAt: ts('2026-06-01T08:00:00Z'),
    },
    {
      _id: IDS.users.admin,
      uid: IDS.users.admin,
      fullName: 'Phạm Văn D',
      email: 'admin@ecoschedule.test',
      phone: '0909456789',
      role: ROLES.ADMIN,
      status: 'active',
      emailVerified: true,
      city: PROJECT.city,
      district: PROJECT.district,
      ward: '',
      neighborhood: '',
      companyId: null,
      createdAt: ts('2026-06-01T08:00:00Z'),
      updatedAt: ts('2026-06-01T08:00:00Z'),
    },
  ];
}

function getCollectionCompanies() {
  return [
    {
      _id: IDS.company,
      companyId: IDS.company,
      companyName: 'Công ty Môi Trường Đô Thị Sơn Trà',
      phone: '02363888888',
      email: 'contact@moitruongsontra.vn',
      address: `123 Võ Văn Kiệt, ${PROJECT.district}, Đà Nẵng`,
      managerId: IDS.users.manager,
      serviceAreas: SON_TRA_WARDS.map((w) => w.name),
      status: 'active',
      createdAt: ts('2026-06-01T00:00:00Z'),
      updatedAt: ts('2026-06-01T00:00:00Z'),
    },
  ];
}

function getRoutes() {
  return SON_TRA_ROUTE_GROUPS.map((group) => {
    const wards = group.wardSlugs.map((slug) => wardBySlug(slug));
    const wardNames = wards.map((w) => w.name);
    const neighborhoods = wards.flatMap((w) => w.neighborhoods);
    const firstWard = wards[0];

    return {
      _id: group.id,
      routeId: group.id,
      routeName: group.name,
      companyId: IDS.company,
      city: PROJECT.city,
      district: PROJECT.district,
      wards: wardNames,
      neighborhoods,
      startPoint: {
        lat: firstWard.lat,
        lng: firstWard.lng,
        address: `Điểm bắt đầu - ${firstWard.name}`,
      },
      endPoint: {
        lat: firstWard.lat + 0.005,
        lng: firstWard.lng + 0.004,
        address: `Điểm kết thúc - ${firstWard.name}`,
      },
      status: 'active',
      createdBy: IDS.users.manager,
      createdAt: ts('2026-06-02T00:00:00Z'),
      updatedAt: ts('2026-06-02T00:00:00Z'),
    };
  });
}

function getRouteAssignments() {
  const collectors = [IDS.users.collector, IDS.users.collector2];
  const dates = ['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13'];

  return SON_TRA_ROUTE_GROUPS.map((group, index) => ({
    _id: `assignment_${String(index + 1).padStart(3, '0')}`,
    assignmentId: `assignment_${String(index + 1).padStart(3, '0')}`,
    routeId: group.id,
    collectorId: collectors[index % collectors.length],
    companyId: IDS.company,
    assignedDate: ts(`${dates[index]}T00:00:00Z`),
    startTime: index % 2 === 0 ? '17:00' : '08:00',
    endTime: index % 2 === 0 ? '19:00' : '10:00',
    vehicleCode: group.vehicleCode,
    status: index === 0 ? 'assigned' : index === 1 ? 'in_progress' : 'assigned',
    startedAt: index === 1 ? ts(`${dates[index]}T08:05:00Z`) : null,
    completedAt: null,
    createdBy: IDS.users.manager,
    createdAt: ts('2026-06-04T10:00:00Z'),
    updatedAt: ts('2026-06-04T10:00:00Z'),
  }));
}

function buildScheduleDoc({
  id, areaId, routeId, wasteTypeId, ward, neighborhood, date, startTime, endTime, repeatDays, status, note,
}) {
  const scheduleDate = ts(`${date}T${startTime}:00Z`);
  const doc = {
    _id: id,
    scheduleId: id,
    areaId,
    routeId,
    wasteTypeId,
    city: PROJECT.city,
    district: PROJECT.district,
    ward,
    neighborhood,
    scheduleDate,
    startTime,
    endTime,
    repeatType: 'weekly',
    repeatDays,
    status,
    note,
    createdBy: IDS.users.manager,
    updatedBy: IDS.users.manager,
    createdAt: ts('2026-06-04T10:00:00Z'),
    updatedAt: ts('2026-06-04T10:00:00Z'),
    schedule_date: scheduleDate.toDate().toISOString(),
    trash_type: WASTE_TYPE_NAMES[wasteTypeId],
    time_slot: `${startTime} - ${endTime}`,
  };
  return doc;
}

function getCollectionSchedules() {
  const schedules = [];
  let scheduleIndex = 1;

  const routeByWardSlug = {};
  SON_TRA_ROUTE_GROUPS.forEach((group) => {
    group.wardSlugs.forEach((slug) => {
      routeByWardSlug[slug] = group.id;
    });
  });

  const wasteRotation = [
    IDS.wasteTypes.organic,
    IDS.wasteTypes.recyclable,
    IDS.wasteTypes.organic,
    IDS.wasteTypes.bulky,
  ];

  SON_TRA_WARDS.forEach((ward, wardIndex) => {
    const routeId = routeByWardSlug[ward.slug];
    const wasteTypeId = wasteRotation[wardIndex % wasteRotation.length];
    const dayOffset = 10 + wardIndex;

    // Lịch cấp phường (áp dụng toàn phường)
    schedules.push(buildScheduleDoc({
      id: `schedule_${String(scheduleIndex++).padStart(3, '0')}`,
      areaId: wardAreaId(ward.slug),
      routeId,
      wasteTypeId,
      ward: ward.name,
      neighborhood: '',
      date: `2026-06-${String(dayOffset).padStart(2, '0')}`,
      startTime: wardIndex % 2 === 0 ? '17:00' : '08:00',
      endTime: wardIndex % 2 === 0 ? '19:00' : '10:00',
      repeatDays: wardIndex % 2 === 0 ? ['Monday', 'Wednesday', 'Friday'] : ['Tuesday', 'Saturday'],
      status: 'active',
      note: `Lịch thu gom toàn ${ward.name}, ${PROJECT.district}`,
    }));

    // Lịch cấp tổ (2 tổ đầu tiên mỗi phường)
    ward.neighborhoods.slice(0, 2).forEach((neighborhood, neighIndex) => {
      const neighWaste = neighIndex === 0 ? IDS.wasteTypes.organic : IDS.wasteTypes.recyclable;
      schedules.push(buildScheduleDoc({
        id: `schedule_${String(scheduleIndex++).padStart(3, '0')}`,
        areaId: neighborhoodAreaId(ward.slug, neighborhood),
        routeId,
        wasteTypeId: neighWaste,
        ward: ward.name,
        neighborhood,
        date: `2026-06-${String(dayOffset + neighIndex).padStart(2, '0')}`,
        startTime: neighIndex === 0 ? '17:00' : '08:00',
        endTime: neighIndex === 0 ? '19:00' : '10:00',
        repeatDays: neighIndex === 0 ? ['Monday', 'Thursday'] : ['Wednesday', 'Saturday'],
        status: ward.slug === 'man_thai' && neighIndex === 1 ? 'delayed' : 'active',
        note: `Thu gom tại ${neighborhood}, ${ward.name}`,
      }));
    });
  });

  return schedules;
}

function getReports() {
  return [
    {
      _id: IDS.reports.report001,
      reportId: IDS.reports.report001,
      citizenId: IDS.users.resident,
      title: 'Rác tồn đọng trước cổng trường',
      description: 'Rác chưa được thu gom trong 2 ngày tại Tổ 12, Thọ Quang.',
      category: 'garbage_overflow',
      severity: 'medium',
      imageUrls: [],
      location: { lat: 16.1123, lng: 108.2456, address: 'Tổ 12, Phường Thọ Quang, Quận Sơn Trà, Đà Nẵng' },
      city: PROJECT.city,
      district: PROJECT.district,
      ward: 'Phường Thọ Quang',
      neighborhood: 'Tổ 12',
      assignedTo: IDS.users.collector,
      assignedBy: IDS.users.manager,
      status: 'assigned',
      createdAt: ts('2026-06-04T10:00:00Z'),
      updatedAt: ts('2026-06-05T09:00:00Z'),
      resolvedAt: null,
    },
    {
      _id: IDS.reports.report002,
      reportId: IDS.reports.report002,
      citizenId: IDS.users.resident2,
      title: 'Điểm đổ rác trái phép ven biển',
      description: 'Rác sinh hoạt đổ trộm tại Phước Mỹ.',
      category: 'illegal_dumping',
      severity: 'high',
      imageUrls: [],
      location: { lat: 16.0789, lng: 108.2567, address: 'Tổ 12, Phường Phước Mỹ, Quận Sơn Trà, Đà Nẵng' },
      city: PROJECT.city,
      district: PROJECT.district,
      ward: 'Phường Phước Mỹ',
      neighborhood: 'Tổ 12',
      assignedTo: null,
      assignedBy: null,
      status: 'submitted',
      createdAt: ts('2026-06-05T14:30:00Z'),
      updatedAt: ts('2026-06-05T14:30:00Z'),
      resolvedAt: null,
    },
    {
      _id: IDS.reports.report003,
      reportId: IDS.reports.report003,
      citizenId: IDS.users.resident2,
      title: 'Mùi hôi từ điểm tập kết rác',
      description: 'Khu vực An Hải Bắc có mùi hôi khó chịu buổi tối.',
      category: 'bad_smell',
      severity: 'low',
      imageUrls: [],
      location: { lat: 16.0678, lng: 108.2412, address: 'Tổ 1, Phường An Hải Bắc, Quận Sơn Trà, Đà Nẵng' },
      city: PROJECT.city,
      district: PROJECT.district,
      ward: 'Phường An Hải Bắc',
      neighborhood: 'Tổ 1',
      assignedTo: IDS.users.collector2,
      assignedBy: IDS.users.manager,
      status: 'in_progress',
      createdAt: ts('2026-06-06T09:00:00Z'),
      updatedAt: ts('2026-06-06T11:00:00Z'),
      resolvedAt: null,
    },
  ];
}

function getReportComments() {
  return [
    { _id: 'comment_001', commentId: 'comment_001', reportId: IDS.reports.report001, userId: IDS.users.manager, role: ROLES.MANAGER, message: 'Đã tiếp nhận và giao nhân viên xử lý.', imageUrls: [], action: 'assigned', createdAt: ts('2026-06-05T08:00:00Z') },
    { _id: 'comment_002', commentId: 'comment_002', reportId: IDS.reports.report001, userId: IDS.users.collector, role: ROLES.COLLECTOR, message: 'Đã đến hiện trường, đang thu gom.', imageUrls: [], action: 'in_progress', createdAt: ts('2026-06-05T09:00:00Z') },
    { _id: 'comment_003', commentId: 'comment_003', reportId: IDS.reports.report003, userId: IDS.users.collector2, role: ROLES.COLLECTOR, message: 'Đang khử mùi và dọn dẹp khu vực.', imageUrls: [], action: 'in_progress', createdAt: ts('2026-06-06T11:00:00Z') },
  ];
}

function getInvoices() {
  return [
    { _id: IDS.invoices.invoice001, invoiceId: IDS.invoices.invoice001, userId: IDS.users.resident, billingMonth: 6, billingYear: 2026, amount: 50000, currency: 'VND', feeType: 'monthly_sanitation_fee', status: 'unpaid', dueDate: ts('2026-06-25T00:00:00Z'), createdBy: IDS.users.admin, createdAt: ts('2026-06-01T00:00:00Z'), updatedAt: ts('2026-06-01T00:00:00Z'), paidAt: null },
    { _id: IDS.invoices.invoice002, invoiceId: IDS.invoices.invoice002, userId: IDS.users.resident, billingMonth: 5, billingYear: 2026, amount: 50000, currency: 'VND', feeType: 'monthly_sanitation_fee', status: 'paid', dueDate: ts('2026-05-25T00:00:00Z'), createdBy: IDS.users.admin, createdAt: ts('2026-05-01T00:00:00Z'), updatedAt: ts('2026-05-10T10:00:00Z'), paidAt: ts('2026-05-10T10:00:00Z') },
    { _id: 'invoice_003', invoiceId: 'invoice_003', userId: IDS.users.resident2, billingMonth: 6, billingYear: 2026, amount: 50000, currency: 'VND', feeType: 'monthly_sanitation_fee', status: 'unpaid', dueDate: ts('2026-06-25T00:00:00Z'), createdBy: IDS.users.admin, createdAt: ts('2026-06-01T00:00:00Z'), updatedAt: ts('2026-06-01T00:00:00Z'), paidAt: null },
  ];
}

function getPayments() {
  return [
    { _id: IDS.payments.payment001, paymentId: IDS.payments.payment001, invoiceId: IDS.invoices.invoice002, userId: IDS.users.resident, amount: 50000, currency: 'VND', method: 'VNPay', transactionCode: 'VNPAY_123456789', status: 'success', gatewayResponse: { code: '00', message: 'Success' }, createdAt: ts('2026-05-10T09:58:00Z'), paidAt: ts('2026-05-10T10:00:00Z') },
  ];
}

function getNotifications() {
  const items = [
    { _id: IDS.notifications.noti001, notificationId: IDS.notifications.noti001, userId: IDS.users.resident, title: 'Lịch thu gom rác ngày mai', content: 'Ngày mai xe sẽ thu gom rác hữu cơ tại Tổ 12, Phường Thọ Quang.', type: 'schedule', link: '/tra-cuu', isRead: false, senderId: IDS.users.manager, senderRole: ROLES.MANAGER, senderName: 'Công ty Môi Trường Đô Thị Sơn Trà', createdAt: ts('2026-06-04T10:00:00Z'), readAt: null },
    { _id: IDS.notifications.noti002, notificationId: IDS.notifications.noti002, userId: IDS.users.resident, title: 'Hóa đơn phí vệ sinh tháng 6/2026', content: 'Phí vệ sinh Quận Sơn Trà tháng 6/2026. Hạn thanh toán 25/06/2026.', type: 'payment', link: '/thanh-toan', isRead: false, senderId: IDS.users.admin, senderRole: ROLES.ADMIN, senderName: 'Hệ thống EcoSchedule', createdAt: ts('2026-06-01T00:00:00Z'), readAt: null },
    { _id: IDS.notifications.noti003, notificationId: IDS.notifications.noti003, userId: IDS.users.resident2, title: 'Phản ánh đã được tiếp nhận', content: 'Phản ánh tại Phường An Hải Bắc đang được xử lý.', type: 'report', link: '/phan-anh', isRead: true, senderId: IDS.users.manager, senderRole: ROLES.MANAGER, senderName: 'Công ty Môi Trường Đô Thị Sơn Trà', createdAt: ts('2026-06-06T09:30:00Z'), readAt: ts('2026-06-06T10:00:00Z') },
  ];

  return items.map((item) => ({
    ...item,
    user_id: item.userId,
    is_read: item.isRead,
    sent_at: item.createdAt,
    sender_role: item.senderRole,
    sender_name: item.senderName,
  }));
}

function getNotificationSettings() {
  return [
    { _id: IDS.users.resident, userId: IDS.users.resident, email: true, sms: false, push: true, scheduleReminder: true, paymentReminder: true, reportUpdate: true, systemNews: true, updatedAt: ts('2026-06-04T10:00:00Z') },
    { _id: IDS.users.resident2, userId: IDS.users.resident2, email: true, sms: true, push: true, scheduleReminder: true, paymentReminder: true, reportUpdate: true, systemNews: true, updatedAt: ts('2026-06-04T10:00:00Z') },
    { _id: IDS.users.collector, userId: IDS.users.collector, email: true, sms: true, push: true, scheduleReminder: true, paymentReminder: false, reportUpdate: true, systemNews: true, updatedAt: ts('2026-06-04T10:00:00Z') },
    { _id: IDS.users.collector2, userId: IDS.users.collector2, email: true, sms: true, push: true, scheduleReminder: true, paymentReminder: false, reportUpdate: true, systemNews: true, updatedAt: ts('2026-06-04T10:00:00Z') },
  ];
}

function getSystemLogs() {
  return [
    { _id: IDS.logs.log001, logId: IDS.logs.log001, userId: IDS.users.admin, role: ROLES.ADMIN, action: 'SEED_DATABASE', targetCollection: 'areas', targetId: 'area_district_son_tra', description: `Seeded full database for ${PROJECT.district} on project ${PROJECT.id}.`, createdAt: ts('2026-06-01T00:00:00Z') },
    { _id: IDS.logs.log002, logId: IDS.logs.log002, userId: IDS.users.manager, role: ROLES.MANAGER, action: 'ASSIGN_ROUTE', targetCollection: 'route_assignments', targetId: 'assignment_001', description: 'Assigned collectors to 4 Son Tra collection routes.', createdAt: ts('2026-06-04T10:00:00Z') },
  ];
}

const SEED_ORDER = [
  { name: 'waste_types', getter: getWasteTypes },
  { name: 'areas', getter: getAreas },
  { name: 'users', getter: getUsers },
  { name: 'collection_companies', getter: getCollectionCompanies },
  { name: 'routes', getter: getRoutes },
  { name: 'route_assignments', getter: getRouteAssignments },
  { name: 'collection_schedules', getter: getCollectionSchedules },
  { name: 'reports', getter: getReports },
  { name: 'report_comments', getter: getReportComments },
  { name: 'invoices', getter: getInvoices },
  { name: 'payments', getter: getPayments },
  { name: 'notifications', getter: getNotifications },
  { name: 'notification_settings', getter: getNotificationSettings },
  { name: 'system_logs', getter: getSystemLogs },
];

module.exports = {
  PROJECT,
  IDS,
  AUTH_ACCOUNTS,
  SEED_ORDER,
  SON_TRA_WARDS,
};

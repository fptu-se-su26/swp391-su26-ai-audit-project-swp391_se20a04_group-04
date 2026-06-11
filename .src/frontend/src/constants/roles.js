export const ROLES = {
  RESIDENT: 'resident',
  COLLECTOR: 'collector',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

const LEGACY_ROLE_MAP = {
  Citizen: ROLES.RESIDENT,
  'Garbage Collector': ROLES.COLLECTOR,
  GarbageCollector: ROLES.COLLECTOR,
  'Collection Company Manager': ROLES.MANAGER,
  CompanyManager: ROLES.MANAGER,
  Manager: ROLES.MANAGER,
  Admin: ROLES.ADMIN,
};

export function normalizeRole(role) {
  if (!role) return ROLES.RESIDENT;
  return LEGACY_ROLE_MAP[role] || role;
}

export const REGISTER_ROLES = [
  { value: ROLES.RESIDENT, label: 'Người dân (Resident)', desc: 'Người dân sinh sống tại khu vực' },
  { value: ROLES.COLLECTOR, label: 'Nhân viên thu gom (Collector)', desc: 'Nhân viên thu gom rác thải' },
  { value: ROLES.MANAGER, label: 'Quản lý công ty (Manager)', desc: 'Quản lý công ty thu gom rác' },
];

export const ADDRESS_LABELS = {
  [ROLES.RESIDENT]: { label: 'Tên hộ gia đình', placeholder: 'VD: Hộ gia đình Nguyễn Văn A' },
  [ROLES.COLLECTOR]: { label: 'Tên tổ dân phố', placeholder: 'VD: Tổ dân phố số 5, P. Mân Thái' },
  [ROLES.MANAGER]: { label: 'Tên công ty', placeholder: 'VD: Công ty TNHH Môi Trường Xanh Đà Nẵng' },
};



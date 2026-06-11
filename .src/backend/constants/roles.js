const ROLES = {
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

function normalizeRole(role) {
  if (!role) return ROLES.RESIDENT;
  return LEGACY_ROLE_MAP[role] || role;
}

module.exports = { ROLES, normalizeRole };

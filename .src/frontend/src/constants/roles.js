export const ROLES = {
  RESIDENT: 'Resident',
  MANAGER: 'Collection Company Manager',
  COLLECTOR: 'Collector',
};

export function normalizeRole(role = '') {
  if (typeof role !== 'string') return ROLES.RESIDENT;
  const normalized = role.trim().toLowerCase();

  if (normalized.includes('manager')) return ROLES.MANAGER;
  if (normalized.includes('collector')) return ROLES.COLLECTOR;
  if (normalized.includes('resident') || normalized.includes('citizen')) return ROLES.RESIDENT;

  return role;
}

/** Canonical roles. Everything else in the app compares against these. */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
}

/**
 * The API is the source of truth for a user's role; this map only normalises
 * the many spellings a backend may send. No screen ever hardcodes a role string.
 */
const ROLE_ALIASES = {
  SUPER_ADMIN: ROLES.SUPER_ADMIN, SUPERADMIN: ROLES.SUPER_ADMIN, ROLE_SUPER_ADMIN: ROLES.SUPER_ADMIN, PLATFORM_ADMIN: ROLES.SUPER_ADMIN,
  ADMIN: ROLES.ADMIN, ROLE_ADMIN: ROLES.ADMIN, OWNER: ROLES.ADMIN, STORE_OWNER: ROLES.ADMIN, MERCHANT: ROLES.ADMIN,
  USER: ROLES.CUSTOMER, ROLE_USER: ROLES.CUSTOMER, CUSTOMER: ROLES.CUSTOMER, ROLE_CUSTOMER: ROLES.CUSTOMER,
}

export function normalizeRole(input) {
  if (!input) return null
  if (Array.isArray(input)) {
    const mapped = input.map(normalizeRole).filter(Boolean)
    return (
      mapped.find((r) => r === ROLES.SUPER_ADMIN) ??
      mapped.find((r) => r === ROLES.ADMIN) ??
      mapped[0] ?? null
    )
  }
  if (typeof input === 'object') {
    return normalizeRole(input.role ?? input.name ?? input.authority ?? input.roles ?? input.authorities)
  }
  return ROLE_ALIASES[String(input).trim().toUpperCase().replace(/[\s-]+/g, '_')] ?? null
}

export const isSuperAdmin = (role) => normalizeRole(role) === ROLES.SUPER_ADMIN
export const isAdmin = (role) => normalizeRole(role) === ROLES.ADMIN
export const isCustomer = (role) => normalizeRole(role) === ROLES.CUSTOMER

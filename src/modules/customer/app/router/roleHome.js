import { ROLES, normalizeRole } from '@/app/config/roles'
import { ROUTES } from './routes'

/** Post-login landing route per role. */
export const ROLE_HOME = {
  [ROLES.ADMIN]: ROUTES.owner.dashboard,
  [ROLES.CUSTOMER]: ROUTES.customer.home,
}

export function homePathForRole(role) {
  return ROLE_HOME[normalizeRole(role)] ?? ROUTES.customer.home
}

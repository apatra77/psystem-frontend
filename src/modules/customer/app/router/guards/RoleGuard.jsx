import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/app/store/authStore'
import { normalizeRole } from '@/app/config/roles'
import { homePathForRole } from '../roleHome'
import { ROUTES } from '../routes'

/**
 * Role gate. `allow` holds canonical roles; the role itself always comes from the API.
 * A signed-in user in the wrong tree is bounced to their own home rather than a dead end;
 * `strict` sends them to 403 instead, for routes where silence would be confusing.
 */
export default function RoleGuard({ allow = [], strict = false, children }) {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  const location = useLocation()
  const allowed = allow.map(normalizeRole)

  if (!token) return <Navigate to={ROUTES.auth.login} replace state={{ from: location.pathname }} />
  if (!allowed.includes(role)) return <Navigate to={strict ? ROUTES.errors.forbidden : homePathForRole(role)} replace />
  return children ?? <Outlet />
}

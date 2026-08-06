import { useAuthStore } from '@/app/store/authStore'
import { hasAnyPermission, hasPermission } from '@/app/permissions/permissions'

/**
 * Conditional rendering by permission — hides buttons the user cannot use.
 *   <Can permission={PERMISSIONS.PRODUCT_MANAGE}><Button/></Can>
 */
export default function Can({ permission, mode = 'all', fallback = null, children }) {
  const permissions = useAuthStore((s) => s.permissions)
  const list = Array.isArray(permission) ? permission : [permission]
  const ok = mode === 'any' ? hasAnyPermission(permissions, list) : hasPermission(permissions, list)
  return ok ? children : fallback
}

import { setAccessToken } from '@/shared/api/tokenBridge'
import { normalizeRole } from '@/app/config/roles'
import { permissionsForRole } from '@/app/permissions/permissions'
import useAuthStore from '@/app/store/authStore'

/** Keeps zustand auth state in sync after the landing-page login flow. */
export function syncAuthStoreFromStoredUser(user) {
  if (!user?.token) return

  setAccessToken(user.token)
  const role = normalizeRole(user.role)

  useAuthStore.getState().establishSession({
    token: user.token,
    expiresAt: null,
    permissions: permissionsForRole(role),
    user: {
      id: user.userId ?? null,
      fullName: user.fullName ?? '',
      email: user.email ?? '',
      phone: user.mobile ?? '',
      role,
    },
  })
}

export function clearSyncedAuthStore() {
  useAuthStore.getState().logout({ callApi: false })
}

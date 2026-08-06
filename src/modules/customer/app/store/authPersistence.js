/**
 * Bridges the existing login session (`authUser` / `authToken`) with the
 * customer portal's zustand auth store.
 */
import { normalizeRole } from '@/app/config/roles'
import { permissionsForRole } from '@/app/permissions/permissions'

const SESSION_KEY = 'authUser'
const TOKEN_KEY = 'authToken'

const storage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

function mapStoredUser(stored) {
  if (!stored) return null
  const role = normalizeRole(stored.role)
  return {
    user: {
      id: stored.userId ?? null,
      fullName: stored.fullName ?? '',
      email: stored.email ?? '',
      phone: stored.mobile ?? '',
      role,
      avatarUrl: stored.avatarUrl ?? null,
    },
    role,
    permissions: permissionsForRole(role),
    expiresAt: null,
  }
}

export function readPersistedSession() {
  try {
    const raw = storage()?.getItem(SESSION_KEY)
    return raw ? mapStoredUser(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function writePersistedSession(session) {
  try {
    let existing = null
    const raw = storage()?.getItem(SESSION_KEY)
    if (raw) existing = JSON.parse(raw)

    const user = session.user ?? {}
    storage()?.setItem(
      SESSION_KEY,
      JSON.stringify({
        ...existing,
        token: storage()?.getItem(TOKEN_KEY) ?? existing?.token ?? null,
        userId: user.id ?? existing?.userId ?? null,
        fullName: user.fullName || existing?.fullName || '',
        email: user.email || existing?.email || '',
        mobile: user.phone || existing?.mobile || '',
        role: user.role ?? existing?.role ?? null,
      }),
    )
  } catch {
    /* storage unavailable */
  }
}

export function clearPersistedSession() {
  try {
    storage()?.removeItem(SESSION_KEY)
    storage()?.removeItem(TOKEN_KEY)
  } catch {
    /* nothing to clear */
  }
}

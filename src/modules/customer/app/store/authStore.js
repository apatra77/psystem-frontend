import { create } from 'zustand'
import authService, { toSession } from '@/app/services/auth.service'
import { normalizeRole } from '@/app/config/roles'
import { hasAnyPermission, hasPermission, permissionsForRole } from '@/app/permissions/permissions'
import { clearAccessToken, getAccessToken, setAccessToken, setForbiddenHandler, setUnauthorizedHandler } from '@/shared/api/tokenBridge'
import { decodeJwt, isJwtExpired, jwtRole, jwtSubject } from '@/shared/api/jwt'
import { clearPersistedSession, readPersistedSession, writePersistedSession } from './authPersistence'
import { AUTO_LOGOUT_IDLE_MS, ENABLE_IDLE_AUTO_LOGOUT } from '@/app/constants/app'

const initialState = {
  token: null,
  user: null,
  role: null,
  permissions: [],
  expiresAt: null,
  status: 'idle',        // idle | authenticating | authenticated
  bootstrapped: false,   // local session restore finished
  pendingIdentifier: null,
  pendingPurpose: 'LOGIN',
  sessionExpired: false,
  error: null,
}

let idleTimer = null

/**
 * Bearer access token only — no refresh token anywhere in the flow.
 *
 * Session lifetime rules:
 *  - A reload, a route change or a closed tab never ends the session. Startup
 *    rebuilds the whole auth state locally from the stored token plus the
 *    profile snapshot — no `/auth/me`, no network call of any kind.
 *  - The session ends when the user signs out, or when the stored token is
 *    genuinely unusable: expired by its own `exp` claim, or rejected with a 401
 *    by the API. Both leave the app in a clean signed-out state rather than a
 *    broken half-authenticated one.
 */
export const useAuthStore = create((set, get) => ({
  ...initialState,

  isAuthenticated: () => !!get().token,
  hasRole: (...roles) => roles.map(normalizeRole).includes(get().role),
  can: (permission) => hasPermission(get().permissions, permission),
  canAny: (permissions) => hasAnyPermission(get().permissions, permissions),

  clearError: () => set({ error: null }),
  clearSessionExpired: () => set({ sessionExpired: false }),

  /** Resets the auto-logout countdown. No-op while idle auto-logout is disabled. */
  touchSession: () => {
    if (!ENABLE_IDLE_AUTO_LOGOUT || !get().token) return
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => get().expireSession(), AUTO_LOGOUT_IDLE_MS)
  },

  /** Only for a token the API has rejected (401) — never called on reload. */
  expireSession: () => {
    if (!get().token) return
    clearTimeout(idleTimer)
    clearAccessToken()
    clearPersistedSession()
    set({ ...initialState, bootstrapped: true, sessionExpired: true })
  },

  requestOtp: async (identifier, purpose = 'LOGIN') => {
    set({ status: 'authenticating', error: null })
    try {
      const res = purpose === 'REGISTER'
        ? await authService.resendOtp(identifier, 'REGISTER')
        : await authService.requestLoginOtp(identifier)
      set({ status: 'idle', pendingIdentifier: identifier, pendingPurpose: purpose })
      return res
    } catch (error) {
      set({ status: 'idle', error: error.message })
      throw error
    }
  },

  verifyOtp: async (otp) => {
    const { pendingIdentifier, pendingPurpose } = get()
    set({ status: 'authenticating', error: null })
    try {
      const res = pendingPurpose === 'REGISTER'
        ? await authService.verifyRegisterOtp(pendingIdentifier, otp)
        : await authService.verifyLoginOtp(pendingIdentifier, otp)
      return get().establishSession(toSession(res, pendingIdentifier))
    } catch (error) {
      set({ status: 'idle', error: error.message })
      throw error
    }
  },

  loginWithPassword: async (email, password) => {
    set({ status: 'authenticating', error: null })
    try {
      const res = await authService.loginWithPassword(email, password)
      return get().establishSession(toSession(res, email))
    } catch (error) {
      set({ status: 'idle', error: error.message })
      throw error
    }
  },

  loginWithProvider: async (provider, credential) => {
    set({ status: 'authenticating', error: null })
    try {
      const res = await authService.socialLogin(provider, credential)
      return get().establishSession(toSession(res))
    } catch (error) {
      set({ status: 'idle', error: error.message })
      throw error
    }
  },

  register: async (payload) => {
    set({ status: 'authenticating', error: null })
    try {
      const res = await authService.register(payload)
      set({ status: 'idle', pendingIdentifier: payload.email || payload.phone, pendingPurpose: 'REGISTER' })
      return res
    } catch (error) {
      set({ status: 'idle', error: error.message })
      throw error
    }
  },

  establishSession: (session) => {
    setAccessToken(session.token)
    writePersistedSession(session)
    set({
      token: session.token,
      user: session.user,
      role: session.user?.role ?? null,
      permissions: session.permissions ?? [],
      expiresAt: session.expiresAt ?? null,
      status: 'authenticated',
      bootstrapped: true,
      pendingIdentifier: null,
      sessionExpired: false,
      error: null,
    })
    get().touchSession()
    return session
  },

  updateUser: (patch) =>
    set((state) => {
      const user = { ...state.user, ...patch }
      /* Keep the restore snapshot current, or a refresh would show stale details. */
      writePersistedSession({ user, permissions: state.permissions, expiresAt: state.expiresAt })
      return { user }
    }),

  /**
   * One-time, fully local session restore.
   *
   * Runs synchronously and hits no endpoint: the token is read from storage,
   * checked against its own `exp` claim, and the user/role/permissions are
   * rebuilt from the JWT claims, falling back to the persisted snapshot for the
   * fields a token does not carry. A refresh therefore never signs anyone out
   * and never flashes the public landing page.
   */
  bootstrap: () => {
    if (get().bootstrapped) return

    const token = getAccessToken()
    if (!token) {
      set({ bootstrapped: true })
      return
    }

    /* Expired by its own claim — the API would reject it, so don't pretend. */
    if (isJwtExpired(token)) {
      clearAccessToken()
      clearPersistedSession()
      set({ ...initialState, bootstrapped: true })
      return
    }

    const claims = decodeJwt(token) ?? {}
    const snapshot = readPersistedSession() ?? {}
    const role = normalizeRole(jwtRole(token) ?? snapshot.role)

    get().establishSession({
      token,
      expiresAt: claims.exp ? claims.exp * 1000 : (snapshot.expiresAt ?? null),
      permissions: snapshot.permissions?.length ? snapshot.permissions : permissionsForRole(role),
      user: {
        ...(snapshot.user ?? {}),
        id: snapshot.user?.id ?? claims.sub ?? null,
        email: snapshot.user?.email ?? jwtSubject(token) ?? '',
        role,
      },
    })
  },

  /** The one deliberate way out. Callers redirect to the public landing after. */
  logout: async ({ callApi = true } = {}) => {
    if (callApi) { try { await authService.logout() } catch { /* local logout anyway */ } }
    clearTimeout(idleTimer)
    clearAccessToken()
    clearPersistedSession()
    set({ ...initialState, bootstrapped: true })
  },
}))

/* A 401 anywhere tears the session down exactly once and flags it as expired. */
setUnauthorizedHandler(() => {
  const { token, expireSession } = useAuthStore.getState()
  if (token) expireSession()
})
setForbiddenHandler(() => {})

export const selectUser = (s) => s.user
export const selectRole = (s) => s.role
export const selectPermissions = (s) => s.permissions
export const selectIsAuthenticated = (s) => !!s.token

export default useAuthStore

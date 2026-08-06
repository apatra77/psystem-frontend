import http from '@/shared/api/axios'
import { ENDPOINTS } from '@/app/constants/api'
import { normalizeRole } from '@/app/config/roles'
import { permissionsForRole } from '@/app/permissions/permissions'
import { jwtSubject } from '@/shared/api/jwt'

/**
 * Normalises whatever the backend returns into the one session shape the app uses.
 * Role and permissions both come from the API; `permissionsForRole` is only a
 * fallback for backends that don't send a permission list yet.
 */
export function toSession(payload, identifier) {
  const d = payload?.data ?? payload ?? {}
  const rawUser = d.user ?? d
  const token = d.token ?? d.accessToken ?? rawUser.token ?? null
  const role = normalizeRole(rawUser.role ?? rawUser.roles ?? rawUser.authorities)
  const email = identifier?.includes('@') ? identifier.trim() : (rawUser.email ?? jwtSubject(token) ?? '')

  return {
    token,
    expiresAt: d.expiresAt ?? null,
    permissions: Array.isArray(rawUser.permissions) ? rawUser.permissions : permissionsForRole(role),
    user: {
      id: rawUser.id ?? rawUser.userId ?? null,
      fullName: rawUser.name ?? rawUser.fullName ?? '',
      email,
      phone: rawUser.phone ?? rawUser.mobile ?? (identifier && !identifier.includes('@') ? identifier : ''),
      role,
      storeId: rawUser.storeId ?? rawUser.tenantId ?? null,
      avatarUrl: rawUser.avatarUrl ?? null,
      emailVerified: rawUser.emailVerified ?? false,
    },
  }
}

export const authService = {
  requestLoginOtp: (identifier) => http.post(ENDPOINTS.auth.login, { identifier, purpose: 'LOGIN' }),
  loginWithPassword: (email, password) => http.post(ENDPOINTS.auth.loginEmail, { email, password }),
  verifyLoginOtp: (identifier, otp) => http.post(ENDPOINTS.auth.verifyLoginOtp, { identifier, otp, purpose: 'LOGIN' }),
  register: (payload) => http.post(ENDPOINTS.auth.register, payload),
  verifyRegisterOtp: (identifier, otp) => http.post(ENDPOINTS.auth.verifyRegisterOtp, { identifier, otp, purpose: 'REGISTER' }),
  resendOtp: (identifier, purpose = 'LOGIN') => http.post(ENDPOINTS.auth.resendOtp, { identifier, purpose }),
  socialLogin: (provider, credential) => http.post(ENDPOINTS.auth.social, { provider, credential }),
  me: () => http.get(ENDPOINTS.auth.me),
  logout: () => http.post(ENDPOINTS.auth.logout, {}),
  forgotPassword: (identifier) => http.post(ENDPOINTS.auth.forgotPassword, { identifier }),
  resetPassword: (payload) => http.post(ENDPOINTS.auth.resetPassword, payload),
  changePassword: (payload) => http.post(ENDPOINTS.auth.changePassword, payload),
}

export default authService

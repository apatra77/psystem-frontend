import { API_BASE, parseJsonResponse, getErrorMessage } from './api'

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'
export async function requestLoginOtp(identifier) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, purpose: 'LOGIN' }),
  })

  const data = await parseJsonResponse(res)
  if (!res.ok) throw new Error(getErrorMessage(data, res.status))
  return data
}

export async function verifyLoginOtp(identifier, otp) {
  const res = await fetch(`${API_BASE}/api/auth/verify-login-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, otp, purpose: 'LOGIN' }),
  })

  const data = await parseJsonResponse(res)
  if (!res.ok) throw new Error(getErrorMessage(data, res.status))
  return data
}

function decodeJwtSub(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export function resolveLoginEmail(identifier, token) {
  const trimmed = identifier?.trim() ?? ''
  if (trimmed.includes('@')) return trimmed
  return decodeJwtSub(token) ?? trimmed
}

export function getEmailInitials(email) {
  if (!email) return '??'
  const local = email.split('@')[0] || email
  return local.slice(0, 2).toUpperCase()
}

export function saveAuthSession(apiResponse, identifier) {
  const d = apiResponse?.data ?? {}
  const token = d.token ?? apiResponse?.token ?? apiResponse?.accessToken
  const email = resolveLoginEmail(identifier, token)
  const user = {
    token,
    userId: d.userId,
    fullName: d.fullName,
    role: d.role,
    email,
  }
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  return user
}

export function getStoredAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

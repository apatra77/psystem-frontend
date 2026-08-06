import { API_BASE, parseJsonResponse, getErrorMessage } from './api'
import { syncAuthStoreFromStoredUser, clearSyncedAuthStore } from '@/app/syncAuthSession'

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

export function formatUserAddress(address) {
  if (!address) return ''
  if (typeof address === 'string') return address.trim()
  return [
    address.line1,
    address.line2,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
}

function normalizeStoredAddress(address) {
  if (!address) return null
  if (typeof address === 'string') {
    const trimmed = address.trim()
    return trimmed ? { line1: trimmed, line2: '', landmark: '', city: '', state: '', pincode: '' } : null
  }
  return {
    line1: address.line1?.trim() ?? '',
    line2: address.line2?.trim() ?? '',
    landmark: address.landmark?.trim() ?? '',
    city: address.city?.trim() ?? '',
    state: address.state?.trim() ?? '',
    pincode: address.pincode?.trim() ?? '',
  }
}

function mapApiAddressToStored(address) {
  if (!address || typeof address !== 'object') return null
  return normalizeStoredAddress({
    line1: address.addressLine1 ?? address.line1 ?? '',
    line2: address.addressLine2 ?? address.line2 ?? '',
    landmark: address.landmark ?? '',
    city: address.city ?? '',
    state: address.state ?? '',
    pincode: address.postalCode ?? address.pincode ?? '',
  })
}

function resolveLoginAddress(data) {
  if (data?.address != null) {
    return mapApiAddressToStored(data.address)
  }

  const addresses = Array.isArray(data?.addresses) ? data.addresses : []
  if (addresses.length === 0) return null

  const primaryId = data?.primaryAddressId
  const primary =
    primaryId != null
      ? addresses.find(
          (item) =>
            item?.addressId === primaryId ||
            item?.id === primaryId ||
            String(item?.addressId) === String(primaryId) ||
            String(item?.id) === String(primaryId),
        )
      : null

  return mapApiAddressToStored(primary ?? addresses[0])
}

function hasSavedAddress(data, address) {
  if (data?.hasAddress === true) return true
  if (Array.isArray(data?.addresses) && data.addresses.length > 0) return true
  if (data?.address != null) return true
  return isAddressComplete(address)
}

export function isAddressComplete(address) {
  const normalized = normalizeStoredAddress(address)
  if (!normalized) return false
  return Boolean(
    normalized.line1 && normalized.city && normalized.state && /^\d{6}$/.test(normalized.pincode),
  )
}

function isProfileComplete(user) {
  return Boolean(
    user?.fullName?.trim() &&
      user?.email?.trim() &&
      isValidEmail(user.email.trim()) &&
      user?.mobile?.trim() &&
      /^[6-9]\d{9}$/.test(user.mobile.trim()) &&
      isAddressComplete(user.address),
  )
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizeMobile(value) {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

export function saveAuthSession(apiResponse, identifier) {
  const d = apiResponse?.data ?? {}
  const token = d.token ?? apiResponse?.token ?? apiResponse?.accessToken
  const loginEmail = resolveLoginEmail(identifier, token)
  const resolvedAddress = resolveLoginAddress(d)
  const address = resolvedAddress ?? {
    line1: '',
    line2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  }
  const user = {
    token,
    userId: d.userId,
    fullName: d.fullName?.trim() ?? '',
    address,
    email: d.email?.trim() || (loginEmail.includes('@') ? loginEmail : ''),
    mobile: normalizeMobile(d.mobile ?? (loginEmail.includes('@') ? '' : identifier)),
    countryCode: d.countryCode?.trim() || '+91',
    role: d.role,
    hasAddress: hasSavedAddress(d, address),
    primaryAddressId: d.primaryAddressId ?? null,
    profileComplete: false,
  }
  user.profileComplete = user.hasAddress || isProfileComplete(user)
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  syncAuthStoreFromStoredUser(user)
  return user
}

export function needsProfileSetup(user) {
  if (!user?.token) return false
  if (user.profileComplete) return false
  if (user.hasAddress) return false
  if (user.profileSkipped) return false
  return !isProfileComplete(user)
}

export function skipProfileSetup() {
  const user = getStoredAuthUser()
  if (!user) return null
  const updated = { ...user, profileSkipped: true }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated))
  return updated
}

export function updateStoredUserProfile({ fullName, email, mobile, countryCode, address }) {
  const user = getStoredAuthUser()
  if (!user) return null

  const trimmedName = fullName.trim()
  const normalizedAddress = normalizeStoredAddress(address) ?? {
    line1: '',
    line2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  }
  const updated = {
    ...user,
    fullName: trimmedName,
    email: email?.trim() ?? user.email ?? '',
    mobile: normalizeMobile(mobile),
    countryCode: countryCode?.trim() || user.countryCode || '+91',
    address: normalizedAddress,
    hasAddress: isAddressComplete(normalizedAddress),
    profileComplete: false,
  }
  updated.profileComplete = updated.hasAddress || isProfileComplete(updated)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated))
  syncAuthStoreFromStoredUser(updated)
  return updated
}

export function getUserInitials(user) {
  const name = user?.fullName?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return getEmailInitials(user?.email)
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
  clearSyncedAuthStore()
}

const OWNER_ROLES = new Set(['ADMIN', 'OWNER', 'STORE_ADMIN', 'STORE_OWNER', 'SUPER_ADMIN'])

export function isOwnerRole(role) {
  return OWNER_ROLES.has(String(role ?? '').toUpperCase())
}

export function getPostLoginPath(user) {
  return isOwnerRole(user?.role) ? '/owner' : '/customer'
}

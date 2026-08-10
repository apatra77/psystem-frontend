import { authFetch } from './api'

const inFlightPincodeRequests = new Map()

export async function fetchAddressByPincode(pincode, signal) {
  const key = String(pincode)
  if (inFlightPincodeRequests.has(key)) {
    return inFlightPincodeRequests.get(key)
  }

  const request = authFetch(`/api/user/addresses/getaddress/${encodeURIComponent(pincode)}`, {
    signal,
  }).finally(() => {
    inFlightPincodeRequests.delete(key)
  })

  inFlightPincodeRequests.set(key, request)
  return request
}

export function mapPincodeAddressResponse(data) {
  const locations = Array.isArray(data?.data) ? data.data : []
  const location = locations[0] ?? {}

  return {
    city: (location.division ?? '').trim(),
    state: (location.state ?? '').trim(),
  }
}

export function matchIndianState(apiState, states) {
  if (!apiState) return ''
  const normalized = apiState.trim().toLowerCase()
  const exact = states.find((s) => s.toLowerCase() === normalized)
  if (exact) return exact

  const partial = states.find(
    (s) =>
      s.toLowerCase().includes(normalized) ||
      normalized.includes(s.toLowerCase()),
  )
  return partial ?? apiState.trim()
}

export function buildUserDetailsPayload(profile) {
  const address = profile.address ?? {}
  return {
    fullName: profile.fullName?.trim() ?? '',
    email: profile.email?.trim() ?? '',
    mobile: profile.mobile?.trim() ?? '',
    addressLine1: address.line1?.trim() ?? '',
    addressLine2: address.line2?.trim() ?? '',
    landmark: address.landmark?.trim() ?? '',
    city: address.city?.trim() ?? '',
    state: address.state?.trim() ?? '',
    postalCode: address.pincode?.trim() ?? '',
    country: profile.country?.trim() || 'India',
  }
}

export async function saveUserDetails(profile) {
  const payload = buildUserDetailsPayload(profile)
  return authFetch('/api/user/details', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function buildAddressPayload({ fullName, email, mobile, address, country = 'India' }) {
  const addr = address ?? {}
  return {
    recipientName: fullName?.trim() ?? '',
    contactMobile: mobile?.trim() ?? '',
    email: email?.trim() ?? '',
    addressLine1: addr.line1?.trim() ?? '',
    addressLine2: addr.line2?.trim() ?? '',
    city: addr.city?.trim() ?? '',
    state: addr.state?.trim() ?? '',
    postalCode: addr.pincode?.trim() ?? '',
    country: country?.trim() || 'India',
    landmark: addr.landmark?.trim() ?? '',
  }
}

export async function saveUserAddress(profile) {
  const result = await authFetch('/api/user/addresses', {
    method: 'POST',
    body: JSON.stringify(buildAddressPayload(profile)),
  })
  invalidateUserProfileCache()
  return result
}

export async function updateUserAddress(addressId, profile) {
  const result = await authFetch(`/api/user/addresses/${encodeURIComponent(addressId)}`, {
    method: 'PUT',
    body: JSON.stringify(buildAddressPayload(profile)),
  })
  invalidateUserProfileCache()
  return result
}

export async function deleteUserAddress(addressId) {
  const result = await authFetch(`/api/user/addresses/${encodeURIComponent(addressId)}`, {
    method: 'DELETE',
  })
  invalidateUserProfileCache()
  return result
}

function invalidateUserProfileCache() {
  cachedProfile = null
  cachedProfileAt = 0
}

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key]
    if (value != null && value !== '') return value
  }
  return undefined
}

function formatAddressLines(address) {
  if (!address) return ''
  if (typeof address === 'string') return address.trim()
  return [
    address.addressLine1 ?? address.line1,
    address.addressLine2 ?? address.line2,
    address.landmark,
    address.city,
    address.state,
    address.postalCode ?? address.pincode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
}

function formatJoinedDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatOrderDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatPhone(mobile, countryCode = '+91') {
  const digits = String(mobile ?? '').replace(/\D/g, '')
  if (!digits) return '—'
  const local = digits.length >= 10 ? digits.slice(-10) : digits
  const spaced = local.replace(/(\d{5})(\d{5})/, '$1 $2')
  return `${countryCode} ${spaced}`.trim()
}

function mapOrderStatus(status) {
  const normalized = String(status ?? 'processing').toLowerCase()
  const map = {
    delivered: { label: 'Delivered', color: '#40deaa', bg: 'rgba(64,222,170,.14)', border: 'rgba(64,222,170,.34)' },
    shipped: { label: 'Shipped', color: '#6fc2ff', bg: 'rgba(90,162,255,.14)', border: 'rgba(90,162,255,.32)' },
    processing: { label: 'Processing', color: '#ffd58f', bg: 'rgba(255,181,71,.15)', border: 'rgba(255,181,71,.34)' },
    cancelled: { label: 'Cancelled', color: '#ff8a80', bg: 'rgba(255,138,128,0.14)', border: 'rgba(255,138,128,0.34)' },
  }
  return map[normalized] ?? map.processing
}

export function mapUserProfileFromApi(payload) {
  const d = payload?.data ?? payload ?? {}
  const addressesRaw = Array.isArray(d.addresses) ? d.addresses : []
  const primaryId = d.primaryAddressId

  const addresses = addressesRaw.map((item, index) => {
    const id = String(pick(item, 'addressId', 'id') ?? index)
    const label = pick(item, 'label', 'addressType', 'type') ?? (index === 0 ? 'Home' : `Address ${index + 1}`)
    const isDefault =
      item.isDefault === true ||
      item.default === true ||
      (primaryId != null &&
        (item.addressId === primaryId || item.id === primaryId || String(item.addressId) === String(primaryId)))

    return {
      id,
      label,
      name: pick(item, 'recipientName', 'name', 'fullName') ?? pick(d, 'fullName') ?? '',
      phone: pick(item, 'contactMobile', 'mobile', 'phone') ?? pick(d, 'mobile') ?? '',
      line1: pick(item, 'addressLine1', 'line1') ?? '',
      line2: pick(item, 'addressLine2', 'line2') ?? '',
      landmark: pick(item, 'landmark') ?? '',
      city: pick(item, 'city') ?? '',
      state: pick(item, 'state') ?? '',
      pincode: String(pick(item, 'postalCode', 'pincode') ?? ''),
      isDefault,
      lines: formatAddressLines(item),
      raw: item,
    }
  })

  const primaryAddress =
    addresses.find((a) => a.isDefault) ??
    addresses[0] ??
    null

  const location =
    pick(d, 'storeLocation', 'location') ??
    primaryAddress?.lines ??
    [pick(d, 'city'), pick(d, 'state')].filter(Boolean).join(', ')

  const ordersRaw = Array.isArray(d.recentOrders)
    ? d.recentOrders
    : Array.isArray(d.orders)
      ? d.orders
      : []

  const recentOrders = ordersRaw.slice(0, 5).map((order, index) => {
    const amount = Number(pick(order, 'totalAmount', 'amount', 'total', 'price')) || 0
    const status = pick(order, 'status', 'orderStatus') ?? 'processing'
    return {
      id: String(pick(order, 'orderId', 'id', 'orderNumber') ?? `#ORD-${index + 1}`),
      date: formatOrderDate(pick(order, 'orderDate', 'createdAt', 'date')),
      amount,
      amountFmt: `₹${amount.toLocaleString('en-IN')}`,
      status,
      statusMeta: mapOrderStatus(status),
    }
  })

  return {
    fullName: pick(d, 'fullName', 'name') ?? '',
    email: pick(d, 'email') ?? '',
    mobile: pick(d, 'mobile', 'phone') ?? '',
    countryCode: pick(d, 'countryCode') ?? '+91',
    role: pick(d, 'role') ?? 'USER',
    location: location || '—',
    memberSince: formatJoinedDate(pick(d, 'memberSince', 'joinedAt', 'createdAt', 'registeredAt')),
    addresses,
    recentOrders,
  }
}

let inFlightProfileRequest = null
let cachedProfile = null
let cachedProfileAt = 0
const PROFILE_CACHE_MS = 30_000

export async function fetchUserProfile({ force = false } = {}) {
  if (!force && inFlightProfileRequest) {
    return inFlightProfileRequest
  }

  if (!force && cachedProfile && Date.now() - cachedProfileAt < PROFILE_CACHE_MS) {
    return cachedProfile
  }

  inFlightProfileRequest = authFetch('/api/user/profile')
    .then((payload) => {
      const mapped = mapUserProfileFromApi(payload)
      cachedProfile = mapped
      cachedProfileAt = Date.now()
      return mapped
    })
    .finally(() => {
      inFlightProfileRequest = null
    })

  return inFlightProfileRequest
}

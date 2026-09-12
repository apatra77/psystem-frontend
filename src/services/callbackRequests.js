import { authFetch } from './api'

export const CALLBACK_REQUEST_PAGE_SIZE = 10

const STATUS_TO_API = {
  all: 'ALL',
  pending: 'PENDING',
  contacted: 'COMPLETED',
}

export function mapCallbackStatusFilter(filterId) {
  return STATUS_TO_API[filterId] ?? 'ALL'
}

/** Parse GET /api/admin/callback-request list payload. */
export function parseCallbackRequestList(payload) {
  const data = payload?.data ?? payload ?? {}

  return {
    pendingCount: Number(data.pendingCount) || 0,
    completedCount: Number(data.completedCount) || 0,
    totalElements: Number(data.totalElements) || 0,
    totalPages: Math.max(1, Number(data.totalPages) || 1),
    page: Number(data.page) || 0,
    size: Number(data.size) || CALLBACK_REQUEST_PAGE_SIZE,
    requests: Array.isArray(data.requests) ? data.requests : [],
  }
}

function buildCallbackRequestQuery({ fromDate, toDate, status, page, size } = {}) {
  const params = new URLSearchParams()

  if (fromDate) params.set('fromDate', fromDate)
  if (toDate) params.set('toDate', toDate)
  if (status) params.set('status', status)
  if (page != null) params.set('page', String(page))
  if (size != null) params.set('size', String(size))

  const query = params.toString()
  return query ? `/api/admin/callback-request?${query}` : '/api/admin/callback-request'
}

/** GET /api/admin/callback-request — paginated admin callback requests. */
export async function fetchAdminCallbackRequests({
  fromDate,
  toDate,
  status = 'ALL',
  page = 0,
  size = CALLBACK_REQUEST_PAGE_SIZE,
  signal,
} = {}) {
  const path = buildCallbackRequestQuery({ fromDate, toDate, status, page, size })
  return authFetch(path, signal ? { signal } : {})
}

/** PATCH /api/admin/callback-request/{id}/mark-done */
export async function markCallbackRequestDone(id) {
  return authFetch(`/api/admin/callback-request/${encodeURIComponent(id)}/mark-done`, {
    method: 'PATCH',
  })
}

export function isCallbackRequestDone(status) {
  return String(status ?? '').trim().toUpperCase() === 'Y'
}

export const CALLBACK_DESCRIPTION_MAX = 500

function formatMobileForCallbackApi(mobile, countryCode = '+91') {
  const digits = String(mobile ?? '').replace(/\D/g, '')
  const local = digits.length >= 10 ? digits.slice(-10) : digits
  if (!local) return ''
  const spaced = local.replace(/(\d{5})(\d{5})/, '$1 $2')
  return `${countryCode} ${spaced}`.trim()
}

/** POST /api/user/callback-request — customer callback request (requires user JWT). */
export async function createUserCallbackRequest({ customerName, mobileNumber, description, countryCode }) {
  return authFetch('/api/user/callback-request', {
    method: 'POST',
    body: JSON.stringify({
      customerName: customerName.trim(),
      mobileNumber: formatMobileForCallbackApi(mobileNumber, countryCode),
      description: description.trim(),
    }),
  })
}

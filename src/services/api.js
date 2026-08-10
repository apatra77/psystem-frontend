import { notifyUnauthorized } from '@/shared/api/tokenBridge'

export const API_BASE = 'http://66.116.246.58:8080'
export const PRODUCT_API_BASE = 'http://66.116.246.58:8081'
export const CART_API_BASE = 'http://66.116.246.58:8083'
const AUTH_TOKEN_KEY = 'authToken'

let handlingUnauthorized = false

function handleUnauthorizedResponse() {
  if (handlingUnauthorized) return
  handlingUnauthorized = true
  try {
    notifyUnauthorized()
  } finally {
    handlingUnauthorized = false
  }
}

export async function parseJsonResponse(res) {
  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON body */
  }
  return data
}

export function getErrorMessage(data, status) {
  return (
    data?.message ??
    data?.error ??
    (typeof data === 'string' ? data : null) ??
    `Request failed (${status})`
  )
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function authHeaders(extra = {}) {
  const headers = { Accept: 'application/json', ...extra }
  const token = getAuthToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function authFetch(path, options = {}, baseUrl = API_BASE) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...authHeaders(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const data = await parseJsonResponse(res)
  if (res.status === 401) {
    handleUnauthorizedResponse()
  }
  if (!res.ok) throw new Error(getErrorMessage(data, res.status))
  return data
}

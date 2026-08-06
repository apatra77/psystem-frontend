/**
 * Single source of truth for the Bearer access token.
 *
 * Bearer-only auth: no refresh token, no refresh endpoint, no refresh cookie.
 * The token is mirrored into localStorage so the session survives a reload,
 * a closed tab and a browser restart — it ends only when the user signs out or
 * the token itself expires.
 *
 * localStorage is readable by any script on the origin, so an XSS bug would
 * expose the token. That is the accepted trade for a session that never drops
 * out from under the user; `sessionStorage` (tab-scoped, cleared on tab close)
 * is the stricter alternative if that changes.
 *
 * This module also breaks the import cycle store -> axios -> store.
 */
const PERSIST_TOKEN = true
const STORAGE_KEY = 'authToken'

const storage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null // private mode / storage disabled
  }
}

const readPersisted = () => {
  if (!PERSIST_TOKEN) return null
  try {
    return storage()?.getItem(STORAGE_KEY) || null
  } catch {
    return null
  }
}

const writePersisted = (token) => {
  if (!PERSIST_TOKEN) return
  try {
    if (token) storage()?.setItem(STORAGE_KEY, token)
    else storage()?.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable — memory copy still works for this page view */
  }
}

let accessToken = readPersisted()
const handlers = { unauthorized: null, forbidden: null }

export const setAccessToken = (token) => {
  accessToken = token || null
  writePersisted(accessToken)
}

export const getAccessToken = () => accessToken

export const clearAccessToken = () => {
  accessToken = null
  writePersisted(null)
}

export const setUnauthorizedHandler = (fn) => { handlers.unauthorized = fn }
export const setForbiddenHandler = (fn) => { handlers.forbidden = fn }
export const notifyUnauthorized = () => handlers.unauthorized?.()
export const notifyForbidden = () => handlers.forbidden?.()

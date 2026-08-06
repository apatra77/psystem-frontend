/** Decode a JWT payload without a dependency. Never trust this for authorisation — display only. */
export function decodeJwt(token) {
  try {
    const part = String(token).split('.')[1]
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export function jwtSubject(token) {
  const payload = decodeJwt(token)
  return typeof payload?.sub === 'string' ? payload.sub : null
}

export function jwtRole(token) {
  const p = decodeJwt(token)
  return p?.role ?? p?.roles ?? p?.authorities ?? p?.scope ?? null
}

export function isJwtExpired(token, skewSeconds = 30) {
  const exp = decodeJwt(token)?.exp
  if (!exp) return false
  return Date.now() / 1000 > exp - skewSeconds
}

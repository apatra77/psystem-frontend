import { DOCTOR_API_BASE } from './api'

/**
 * Normalize doctor profile image URLs from the API for use in <img src>.
 * Handles relative paths, localhost URLs from the backend, and full remote URLs.
 */
export function resolveDoctorImageUrl(url) {
  if (!url) return ''

  const value = String(url).trim()
  if (!value) return ''
  if (value.startsWith('data:')) return value
  if (value.startsWith('blob:')) return value

  const apiOrigin = new URL(DOCTOR_API_BASE).origin

  if (value.startsWith('/')) {
    return `${DOCTOR_API_BASE}${value}`
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const parsed = new URL(value)
      return `${apiOrigin}${parsed.pathname}${parsed.search}`
    } catch {
      return value
    }
  }

  return `${DOCTOR_API_BASE}/${value.replace(/^\/+/, '')}`
}

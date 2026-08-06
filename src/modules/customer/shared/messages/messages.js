import raw from './messages.json'

/**
 * Single source of truth for every user-facing string.
 *
 *   import { msg, MESSAGES } from '@/shared/messages/messages'
 *   msg('customer.addedToCart', { name: 'Dolo 650' })
 *   MESSAGES.common.loading
 */
export const MESSAGES = raw

const INTERPOLATE = /\{(\w+)\}/g

export function interpolate(template, params = {}) {
  if (typeof template !== 'string') return template
  return template.replace(INTERPOLATE, (match, key) =>
    params[key] === undefined || params[key] === null ? match : String(params[key]),
  )
}

/** Dot-path lookup with `{token}` interpolation. Returns the path if missing (loud in dev). */
export function msg(path, params) {
  const value = path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), MESSAGES)
  if (value === undefined) {
    if (import.meta.env?.DEV) console.warn(`[messages] Missing key: ${path}`)
    return path
  }
  return interpolate(value, params)
}

export const m = msg
export default MESSAGES

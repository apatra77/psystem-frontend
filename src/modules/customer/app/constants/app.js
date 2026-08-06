/**
 * Idle auto-logout is OFF: the product requirement is that a session ends only
 * when the user clicks Logout (or the token expires on its own). Flip this back
 * to `true` to re-enable the inactivity timer below — worth considering, since
 * an unattended signed-in device is the case it was protecting against.
 */
export const ENABLE_IDLE_AUTO_LOGOUT = false
export const AUTO_LOGOUT_IDLE_MS = 30 * 60 * 1000   // 30 minutes of inactivity
export const IDLE_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'visibilitychange']
export const DEBOUNCE_MS = 350
export const PAGE_SIZE = 12
export const SEARCH_HISTORY_LIMIT = 8
export const CANCEL_WINDOW_MINUTES = 15
export const MAX_UPLOAD_MB = 5
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ACCEPTED_DOC_TYPES = [...ACCEPTED_IMAGE_TYPES, 'application/pdf']

import { useEffect } from 'react'
import { useAuthStore } from '@/app/store/authStore'
import { useUiStore } from '@/app/store/uiStore'
import { ENABLE_IDLE_AUTO_LOGOUT, IDLE_EVENTS } from '@/app/constants/app'
import { msg } from '@/shared/messages/messages'
import SplashGate from '@/shared/components/feedback/SplashGate'

/**
 * Owns the session lifecycle so no page has to:
 *  1. runs the one-time local session restore before routes render (no network
 *     call — see authStore.bootstrap),
 *  2. resets the auto-logout timer on user activity,
 *  3. surfaces a toast when the session expires,
 *  4. holds the branded splash screen until step 1 resolves.
 */
export default function AuthProvider({ children }) {
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const bootstrapped = useAuthStore((s) => s.bootstrapped)
  const token = useAuthStore((s) => s.token)
  const sessionExpired = useAuthStore((s) => s.sessionExpired)
  const touchSession = useAuthStore((s) => s.touchSession)
  const clearSessionExpired = useAuthStore((s) => s.clearSessionExpired)
  const toastError = useUiStore((s) => s.error)

  useEffect(() => { bootstrap() }, [bootstrap])

  useEffect(() => {
    if (!token || !ENABLE_IDLE_AUTO_LOGOUT) return undefined
    const onActivity = () => touchSession()
    IDLE_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }))
    return () => IDLE_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity))
  }, [token, touchSession])

  useEffect(() => {
    if (!sessionExpired) return
    toastError(msg('auth.sessionExpired'))
    clearSessionExpired()
  }, [sessionExpired, toastError, clearSessionExpired])

  /*
   * Startup only. The splash is above the router, so navigating between pages
   * never remounts it — lazy routes fall back to their own shimmers instead.
   */
  return <SplashGate ready={bootstrapped}>{children}</SplashGate>
}

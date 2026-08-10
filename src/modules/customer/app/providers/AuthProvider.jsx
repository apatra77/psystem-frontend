import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/authStore'
import { useUiStore } from '@/app/store/uiStore'
import { ROUTES } from '@/app/router/routes'
import { ENABLE_IDLE_AUTO_LOGOUT, IDLE_EVENTS } from '@/app/constants/app'
import { getAccessToken } from '@/shared/api/tokenBridge'
import { isJwtExpired } from '@/shared/api/jwt'
import { msg } from '@/shared/messages/messages'
import SplashGate from '@/shared/components/feedback/SplashGate'

const TOKEN_CHECK_MS = 30_000

/**
 * Owns the session lifecycle so no page has to:
 *  1. runs the one-time local session restore before routes render (no network
 *     call — see authStore.bootstrap),
 *  2. resets the auto-logout timer on user activity,
 *  3. surfaces a toast when the session expires,
 *  4. redirects to the public landing page when the token is expired,
 *  5. holds the branded splash screen until step 1 resolves.
 */
export default function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const bootstrapped = useAuthStore((s) => s.bootstrapped)
  const token = useAuthStore((s) => s.token)
  const sessionExpired = useAuthStore((s) => s.sessionExpired)
  const expireSession = useAuthStore((s) => s.expireSession)
  const touchSession = useAuthStore((s) => s.touchSession)
  const clearSessionExpired = useAuthStore((s) => s.clearSessionExpired)
  const toastError = useUiStore((s) => s.error)

  useEffect(() => { bootstrap() }, [bootstrap])

  /* No authToken → public landing page (Sign In / Get Started). */
  useEffect(() => {
    if (!bootstrapped) return
    if (location.pathname === ROUTES.root) return

    const needsAuth =
      location.pathname.startsWith('/customer') ||
      location.pathname.startsWith('/owner')

    if (needsAuth && !getAccessToken()) {
      navigate(ROUTES.root, { replace: true })
    }
  }, [bootstrapped, location.pathname, navigate, token])

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
    if (location.pathname !== ROUTES.root) {
      navigate(ROUTES.root, { replace: true })
    }
  }, [sessionExpired, toastError, clearSessionExpired, navigate, location.pathname])

  useEffect(() => {
    if (!token) return undefined

    const checkExpiry = () => {
      const currentToken = getAccessToken()
      if (currentToken && isJwtExpired(currentToken)) {
        expireSession()
      }
    }

    checkExpiry()
    const intervalId = window.setInterval(checkExpiry, TOKEN_CHECK_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkExpiry()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [token, expireSession])

  /*
   * Startup only. The splash is above the router, so navigating between pages
   * never remounts it — lazy routes fall back to their own shimmers instead.
   */
  return <SplashGate ready={bootstrapped}>{children}</SplashGate>
}

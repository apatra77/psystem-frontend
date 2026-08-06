import { useLocation } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'

/**
 * Per-route error boundary.
 *
 * Keyed on pathname so React discards the errored boundary when the user
 * navigates: without the key, one crash would leave the error state mounted and
 * every subsequent page would look broken too.
 */
export default function RouteBoundary({ children }) {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary key={pathname} variant="inline">
      {children}
    </ErrorBoundary>
  )
}

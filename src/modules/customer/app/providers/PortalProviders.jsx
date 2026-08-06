import AuthProvider from './AuthProvider'
import ThemeProvider from './ThemeProvider'
import ErrorBoundary from '@/shared/components/feedback/ErrorBoundary'
import NetworkStatusProvider from './NetworkStatusProvider'
import Toaster from '@/shared/ui/Toaster'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'

/** Shared providers for customer portal (BrowserRouter lives in App.jsx). */
export default function PortalProviders({ children }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NetworkStatusProvider>
          <AuthProvider>
            {children}
            <Toaster />
            <ConfirmDialog />
          </AuthProvider>
        </NetworkStatusProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

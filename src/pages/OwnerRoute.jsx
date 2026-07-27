import { Navigate } from 'react-router-dom'
import { getStoredAuthUser } from '../services/auth'
import OwnerPortalPage from './OwnerPortalPage'

export default function OwnerRoute() {
  const user = getStoredAuthUser()
  if (!user?.token) {
    return <Navigate to="/" replace />
  }
  return <OwnerPortalPage />
}

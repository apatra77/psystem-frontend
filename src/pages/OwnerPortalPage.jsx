import { OwnerPortalProvider } from '../owner/context/OwnerPortalContext'
import OwnerLayout from '../owner/components/OwnerLayout'

export default function OwnerPortalPage() {
  return (
    <OwnerPortalProvider>
      <OwnerLayout />
    </OwnerPortalProvider>
  )
}

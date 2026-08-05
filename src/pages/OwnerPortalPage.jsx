import { OwnerPortalProvider, useOwnerPortal } from '../owner/context/OwnerPortalContext'
import OwnerLayout from '../owner/components/OwnerLayout'
import ProfileSetupModal from '../components/modals/ProfileSetupModal'
import { needsProfileSetup } from '../services/auth'

function OwnerPortalGate() {
  const { authUser, updateAuthUser, skipProfileSetup } = useOwnerPortal()
  const showProfileSetup = needsProfileSetup(authUser)

  return (
    <>
      <OwnerLayout />
      {showProfileSetup && (
        <ProfileSetupModal
          initialEmail={authUser?.email ?? ''}
          initialMobile={authUser?.mobile ?? ''}
          initialCountryCode={authUser?.countryCode ?? '+91'}
          initialAddress={authUser?.address ?? null}
          onComplete={updateAuthUser}
          onSkip={skipProfileSetup}
        />
      )}
    </>
  )
}

export default function OwnerPortalPage() {
  return (
    <OwnerPortalProvider>
      <OwnerPortalGate />
    </OwnerPortalProvider>
  )
}

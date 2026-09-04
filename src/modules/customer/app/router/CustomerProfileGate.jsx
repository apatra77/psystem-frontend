import { useState } from 'react'
import ProfileSetupModal from '@/components/modals/ProfileSetupModal'
import {
  getStoredAuthUser,
  needsProfileSetup,
  skipProfileSetup,
} from '@/services/auth'
import { syncAuthStoreFromStoredUser } from '@/app/syncAuthSession'

export default function CustomerProfileGate({ children }) {
  const [authUser, setAuthUser] = useState(() => getStoredAuthUser())
  const showProfileSetup = needsProfileSetup(authUser)

  const refreshAuth = () => {
    const user = getStoredAuthUser()
    setAuthUser(user)
    syncAuthStoreFromStoredUser(user)
    return user
  }

  return (
    <>
      {children}
      {showProfileSetup && authUser && (
        <ProfileSetupModal
          initialFullName={authUser?.fullName ?? ''}
          initialEmail={authUser?.email ?? ''}
          initialMobile={authUser?.mobile ?? ''}
          initialCountryCode={authUser?.countryCode ?? '+91'}
          initialAddress={authUser?.address ?? null}
          onComplete={() => refreshAuth()}
          onSkip={() => {
            skipProfileSetup()
            refreshAuth()
          }}
        />
      )}
    </>
  )
}

import { useEffect, useState } from 'react'
import { fetchUserProfile } from '@/services/user'

/**
 * Reads global store open/close from GET /api/user/profile (`isStoreOpen`: Y/N).
 * Defaults to open until the profile loads or if the field is missing.
 */
export function useCustomerStoreOpen() {
  const [isStoreOpen, setIsStoreOpen] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchUserProfile()
      .then((profile) => {
        if (cancelled || profile?.isStoreOpen === undefined) return
        setIsStoreOpen(Boolean(profile.isStoreOpen))
      })
      .catch(() => {
        /* Keep default open banner on failure. */
      })

    return () => {
      cancelled = true
    }
  }, [])

  return isStoreOpen
}

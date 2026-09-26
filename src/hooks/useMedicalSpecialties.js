import { useEffect, useState } from 'react'
import { fetchAdminMedicalSpecialties, fetchMedicalSpecialties } from '@/services/medicalSpecialties'

export function useMedicalSpecialties({ activeOnly = true } = {}) {
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const list = await fetchMedicalSpecialties({ activeOnly })
        if (!cancelled) setSpecialties(list)
      } catch (err) {
        if (!cancelled) {
          setSpecialties([])
          setError(err instanceof Error ? err.message : 'Could not load specialties')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [activeOnly])

  return { specialties, loading, error }
}

/** Full admin specialty list for owner filters / manage modals. */
export function useAdminMedicalSpecialties({ force = false } = {}) {
  const [specialties, setSpecialties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const list = await fetchAdminMedicalSpecialties({ force })
        if (!cancelled) setSpecialties(list)
      } catch (err) {
        if (!cancelled) {
          setSpecialties([])
          setError(err instanceof Error ? err.message : 'Could not load specialties')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [force])

  return { specialties, loading, error }
}

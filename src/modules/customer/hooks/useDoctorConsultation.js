import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchDoctorAvailableSlots,
  fetchDoctorById,
  fetchDoctors,
  fetchPopularDoctors,
  fetchTopDoctorsNearYou,
} from '@/services/doctors'
import { DEFAULT_CONSULTATION_CITY } from '@/shared/mocks/doctorConsultation'

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}

async function loadPopularSlots(doctors) {
  if (!doctors.length) return {}

  const slotEntries = await Promise.all(
    doctors.map(async (doctor) => {
      try {
        const slots = await fetchDoctorAvailableSlots(doctor.id, 'today')
        return [doctor.id, slots.filter((slot) => slot.available).slice(0, 4)]
      } catch {
        return [doctor.id, []]
      }
    }),
  )

  return Object.fromEntries(slotEntries)
}

export function useDoctorConsultation(city = DEFAULT_CONSULTATION_CITY) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [specialtyId, setSpecialtyId] = useState(null)
  const [topDoctors, setTopDoctors] = useState([])
  const [popularDoctors, setPopularDoctors] = useState([])
  const [popularSlots, setPopularSlots] = useState({})
  const [searchResults, setSearchResults] = useState([])
  const [topLimit, setTopLimit] = useState(50)
  const [popularLimit, setPopularLimit] = useState(3)

  const [loadingTop, setLoadingTop] = useState(true)
  const [loadingPopular, setLoadingPopular] = useState(true)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [error, setError] = useState('')

  const browseRequestId = useRef(0)
  const searchRequestId = useRef(0)

  const debouncedSearch = useDebouncedValue(searchKeyword.trim())
  const isFiltering = Boolean(debouncedSearch || specialtyId)

  useEffect(() => {
    const requestId = ++browseRequestId.current
    let cancelled = false

    ;(async () => {
      setLoadingTop(true)
      setLoadingPopular(true)
      setError('')

      try {
        const [top, popular] = await Promise.all([
          fetchTopDoctorsNearYou({ city, limit: topLimit }),
          fetchPopularDoctors({ city, limit: popularLimit }),
        ])

        if (cancelled || requestId !== browseRequestId.current) return

        setTopDoctors(top)
        setPopularDoctors(popular)

        const slots = await loadPopularSlots(popular)
        if (cancelled || requestId !== browseRequestId.current) return

        setPopularSlots(slots)
      } catch (err) {
        if (cancelled || requestId !== browseRequestId.current) return
        setTopDoctors([])
        setPopularDoctors([])
        setPopularSlots({})
        setError(err?.message ?? 'Could not load doctors')
      } finally {
        if (!cancelled && requestId === browseRequestId.current) {
          setLoadingTop(false)
          setLoadingPopular(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [city, topLimit, popularLimit])

  useEffect(() => {
    if (!debouncedSearch && !specialtyId) {
      setSearchResults([])
      setLoadingSearch(false)
      return undefined
    }

    const requestId = ++searchRequestId.current
    let cancelled = false

    ;(async () => {
      setLoadingSearch(true)
      setError('')

      try {
        const doctors = await fetchDoctors({
          searchKeyword: debouncedSearch || undefined,
          specialtyId: specialtyId || undefined,
          city,
        })

        if (cancelled || requestId !== searchRequestId.current) return
        setSearchResults(doctors)
      } catch (err) {
        if (cancelled || requestId !== searchRequestId.current) return
        setSearchResults([])
        setError(err?.message ?? 'Search failed')
      } finally {
        if (!cancelled && requestId === searchRequestId.current) {
          setLoadingSearch(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [city, debouncedSearch, specialtyId])

  const showAllTopDoctors = useCallback(() => setTopLimit(50), [])
  const showAllPopularDoctors = useCallback(() => setPopularLimit(50), [])

  const fetchProfile = useCallback((id) => fetchDoctorById(id), [])
  const fetchSlots = useCallback(
    (id, consultationDate = 'today') => fetchDoctorAvailableSlots(id, consultationDate),
    [],
  )

  const visibleTopDoctors = useMemo(
    () => (isFiltering ? searchResults : topDoctors),
    [isFiltering, searchResults, topDoctors],
  )

  const topSectionLoading = isFiltering ? loadingSearch : loadingTop

  return {
    city,
    searchKeyword,
    setSearchKeyword,
    specialtyId,
    setSpecialtyId,
    topDoctors: visibleTopDoctors,
    popularDoctors,
    popularSlots,
    isFiltering,
    loadingTop: topSectionLoading,
    loadingPopular,
    loadingSearch,
    error,
    showAllTopDoctors,
    showAllPopularDoctors,
    topLimit,
    popularLimit,
    fetchProfile,
    fetchSlots,
  }
}

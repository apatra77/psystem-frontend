import { useCallback, useEffect, useMemo, useState } from 'react'
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

  const debouncedSearch = useDebouncedValue(searchKeyword.trim())
  const isFiltering = Boolean(debouncedSearch || specialtyId)

  const loadTopDoctors = useCallback(async () => {
    setLoadingTop(true)
    try {
      const doctors = await fetchTopDoctorsNearYou({ city, limit: topLimit })
      setTopDoctors(doctors)
      setError('')
    } catch (err) {
      setTopDoctors([])
      setError(err?.message ?? 'Could not load doctors nearby')
    } finally {
      setLoadingTop(false)
    }
  }, [city, topLimit])

  const loadPopularDoctors = useCallback(async () => {
    setLoadingPopular(true)
    try {
      const doctors = await fetchPopularDoctors({ city, limit: popularLimit })
      setPopularDoctors(doctors)

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
      setPopularSlots(Object.fromEntries(slotEntries))
      setError('')
    } catch (err) {
      setPopularDoctors([])
      setPopularSlots({})
      setError(err?.message ?? 'Could not load popular doctors')
    } finally {
      setLoadingPopular(false)
    }
  }, [city, popularLimit])

  const loadSearchResults = useCallback(async () => {
    if (!debouncedSearch && !specialtyId) {
      setSearchResults([])
      return
    }

    setLoadingSearch(true)
    try {
      const doctors = await fetchDoctors({
        searchKeyword: debouncedSearch || undefined,
        specialtyId: specialtyId || undefined,
        city,
      })
      setSearchResults(doctors)
      setError('')
    } catch (err) {
      setSearchResults([])
      setError(err?.message ?? 'Search failed')
    } finally {
      setLoadingSearch(false)
    }
  }, [city, debouncedSearch, specialtyId])

  useEffect(() => {
    loadTopDoctors()
  }, [loadTopDoctors])

  useEffect(() => {
    loadPopularDoctors()
  }, [loadPopularDoctors])

  useEffect(() => {
    loadSearchResults()
  }, [loadSearchResults])

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
    reloadTop: loadTopDoctors,
    reloadPopular: loadPopularDoctors,
  }
}

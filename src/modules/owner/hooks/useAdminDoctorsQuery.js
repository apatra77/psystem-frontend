import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  clearAdminDoctorsCache,
  fetchAdminDoctors,
  fetchAdminDoctorsDashboardSummary,
  mergeSpecialtiesFromDoctors,
} from '@/services/adminDoctors'
import { buildPageNumbers, DOCTORS_PAGE_SIZE } from '../views/doctors/doctorUtils'

const EMPTY_SUMMARY = {
  totalDoctors: 0,
  activeDoctors: 0,
  activePercent: 0,
  availableToday: 0,
  totalSpecialties: 0,
  addedThisMonth: 0,
}

export function useAdminDoctorsQuery({
  search = '',
  specialtyId = 'all',
  status = 'all',
  storeId = 'all',
  page = 0,
  pageSize = DOCTORS_PAGE_SIZE,
} = {}) {
  const [doctors, setDoctors] = useState([])
  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)

  const load = useCallback(async ({ force = false } = {}) => {
    setLoading(true)
    setError('')
    if (force) clearAdminDoctorsCache({ invalidateLists: true })

    try {
      const [listResult, summaryResult] = await Promise.all([
        fetchAdminDoctors({ search, specialtyId, status, storeId, page, size: pageSize }),
        fetchAdminDoctorsDashboardSummary(),
      ])

      mergeSpecialtiesFromDoctors(listResult.doctors)
      setSummary(summaryResult ?? EMPTY_SUMMARY)
      setDoctors(listResult.doctors)
      setTotalElements(listResult.totalElements)
      setTotalPages(Math.max(1, listResult.totalPages))
      setCurrentPage(listResult.page)
    } catch (err) {
      setDoctors([])
      setSummary(EMPTY_SUMMARY)
      setTotalElements(0)
      setTotalPages(1)
      setCurrentPage(0)
      setError(err instanceof Error ? err.message : 'Could not load doctors')
    } finally {
      setLoading(false)
    }
  }, [search, specialtyId, status, storeId, page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  const rangeStart = totalElements ? currentPage * pageSize + 1 : 0
  const rangeEnd = Math.min(totalElements, (currentPage + 1) * pageSize)
  const pageNumbers = useMemo(
    () => buildPageNumbers(currentPage + 1, totalPages),
    [currentPage, totalPages],
  )

  const reload = useCallback(() => load({ force: true }), [load])

  return {
    doctors,
    summary,
    loading,
    error,
    reload,
    totalElements,
    totalPages,
    currentPage,
    rangeStart,
    rangeEnd,
    pageNumbers,
    pageSize,
  }
}

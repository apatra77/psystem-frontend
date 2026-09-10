import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchGenericNamesPage,
  fetchGenericNamesSearch,
  GENERIC_NAMES_PAGE_SIZE,
  parseGenericNamesPage,
} from '@/services/genericNames'

const SEARCH_DEBOUNCE_MS = 350

export function useAdminGenericNamesQuery({
  searchQuery = '',
  pageSize = GENERIC_NAMES_PAGE_SIZE,
} = {}) {
  const [items, setItems] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const skipInitialSearchDebounceRef = useRef(true)

  useEffect(() => {
    if (skipInitialSearchDebounceRef.current) {
      skipInitialSearchDebounceRef.current = false
      setDebouncedSearch(searchQuery)
      return
    }

    const timer = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, pageSize])

  const apiPage = Math.max(0, page - 1)
  const trimmedSearch = debouncedSearch.trim()

  const loadGenericNames = useCallback(
    async (force = false) => {
      const pagePayload = trimmedSearch
        ? await fetchGenericNamesSearch({
            query: trimmedSearch,
            page: apiPage,
            size: pageSize,
            force,
          })
        : await fetchGenericNamesPage({
            page: apiPage,
            size: pageSize,
            force,
          })

      return parseGenericNamesPage(pagePayload)
    },
    [apiPage, pageSize, trimmedSearch],
  )

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await loadGenericNames()
        if (cancelled) return

        setItems(result.items)
        setTotalElements(result.totalElements)
        setTotalPages(result.totalPages)
      } catch (err) {
        if (cancelled) return
        setItems([])
        setTotalElements(0)
        setTotalPages(1)
        setError(err instanceof Error ? err.message : 'Failed to load generic names')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [loadGenericNames])

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages))
  }, [page, totalPages])

  const currentPage = Math.min(page, totalPages)
  const rangeStart = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalElements)

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, '…', totalPages]
    if (currentPage >= totalPages - 2) return [1, '…', totalPages - 2, totalPages - 1, totalPages]
    return [1, '…', currentPage, '…', totalPages]
  }, [currentPage, totalPages])

  const refetch = useCallback(async () => {
    const result = await loadGenericNames(true)
    setItems(result.items)
    setTotalElements(result.totalElements)
    setTotalPages(result.totalPages)
  }, [loadGenericNames])

  return {
    items,
    totalElements,
    totalPages,
    page,
    setPage,
    currentPage,
    rangeStart,
    rangeEnd,
    pageNumbers,
    loading,
    error,
    refetch,
  }
}

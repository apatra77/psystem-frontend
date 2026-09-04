import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchInventoryPage,
  fetchInventorySummary,
  INVENTORY_PAGE_SIZE,
  mapUiStatusFilterToInventoryApi,
  parseInventoryPage,
  parseInventorySummary,
} from '@/services/inventory'

const SEARCH_DEBOUNCE_MS = 350

export function useInventoryQuery({
  statusFilter = 'all',
  categoryFilter = 'all',
  searchQuery = '',
  refreshKey = 0,
}) {
  const [summary, setSummary] = useState(null)
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
      return
    }

    const timer = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, categoryFilter, debouncedSearch])

  const apiStatus = mapUiStatusFilterToInventoryApi(statusFilter)
  const apiCategoryId = categoryFilter === 'all' ? '' : String(categoryFilter)
  const apiPage = Math.max(0, page - 1)

  const loadInventory = useCallback(
    async (force = false) => {
      const [summaryPayload, pagePayload] = await Promise.all([
        fetchInventorySummary({ force }),
        fetchInventoryPage({
          page: apiPage,
          size: INVENTORY_PAGE_SIZE,
          search: debouncedSearch.trim(),
          status: apiStatus,
          categoryId: apiCategoryId,
          force,
        }),
      ])

      return {
        summary: parseInventorySummary(summaryPayload),
        page: parseInventoryPage(pagePayload),
      }
    },
    [apiCategoryId, apiPage, apiStatus, debouncedSearch],
  )

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await loadInventory()
        if (cancelled) return

        setSummary(result.summary)
        setItems(result.page.items)
        setTotalElements(result.page.totalElements)
        setTotalPages(result.page.totalPages)
      } catch (err) {
        if (cancelled) return
        setSummary(null)
        setItems([])
        setTotalElements(0)
        setTotalPages(1)
        setError(err instanceof Error ? err.message : 'Failed to load inventory')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [loadInventory, refreshKey])

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages))
  }, [page, totalPages])

  const currentPage = Math.min(page, totalPages)
  const rangeStart = totalElements === 0 ? 0 : (currentPage - 1) * INVENTORY_PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * INVENTORY_PAGE_SIZE, totalElements)

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, '…', totalPages]
    if (currentPage >= totalPages - 2) return [1, '…', totalPages - 2, totalPages - 1, totalPages]
    return [1, '…', currentPage, '…', totalPages]
  }, [currentPage, totalPages])

  const refetch = useCallback(async () => {
    const result = await loadInventory(true)
    setSummary(result.summary)
    setItems(result.page.items)
    setTotalElements(result.page.totalElements)
    setTotalPages(result.page.totalPages)
  }, [loadInventory])

  return {
    summary,
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

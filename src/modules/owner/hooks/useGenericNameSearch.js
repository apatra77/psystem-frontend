import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchGenericNamesSearch,
  GENERIC_NAMES_PAGE_SIZE,
  mergeGenericNameItems,
  parseGenericNamesPage,
} from '@/services/genericNames'

const SEARCH_DEBOUNCE_MS = 350
const AUTocomplete_PAGE_SIZE = GENERIC_NAMES_PAGE_SIZE

function canLoadMore({ suggestionsLength, totalElements, page, totalPages, isLast }) {
  if (isLast === true) return false
  if (totalElements > 0 && suggestionsLength < totalElements) return true
  if (totalPages > 0) return page + 1 < totalPages
  return false
}

export function useGenericNameSearch(query = '') {
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLast, setIsLast] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const requestIdRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const fetchingPageRef = useRef(null)

  const stateRef = useRef({
    debouncedQuery: '',
    page: 0,
    suggestionsLength: 0,
    totalElements: 0,
    totalPages: 0,
    isLast: true,
    loading: false,
  })

  useEffect(() => {
    stateRef.current = {
      debouncedQuery,
      page,
      suggestionsLength: suggestions.length,
      totalElements,
      totalPages,
      isLast,
      loading,
    }
  }, [debouncedQuery, page, suggestions.length, totalElements, totalPages, isLast, loading])

  useEffect(() => {
    loadingMoreRef.current = loadingMore
  }, [loadingMore])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(String(query ?? '').trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (!trimmed) {
      setSuggestions([])
      setTotalElements(0)
      setTotalPages(0)
      setIsLast(true)
      setPage(0)
      setError('')
      setLoading(false)
      fetchingPageRef.current = null
      return undefined
    }

    fetchingPageRef.current = null
    const requestId = ++requestIdRef.current
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const payload = await fetchGenericNamesSearch({
          query: trimmed,
          page: 0,
          size: AUTocomplete_PAGE_SIZE,
        })
        const result = parseGenericNamesPage(payload)
        if (cancelled || requestId !== requestIdRef.current) return

        setSuggestions(result.items)
        setTotalElements(result.totalElements)
        setTotalPages(result.totalPages)
        setIsLast(
          result.isLast === true ||
            result.items.length === 0 ||
            (result.totalElements > 0 && result.items.length >= result.totalElements) ||
            (result.totalPages > 0 && result.page + 1 >= result.totalPages),
        )
        setPage(0)
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return
        setSuggestions([])
        setTotalElements(0)
        setTotalPages(0)
        setIsLast(true)
        setPage(0)
        setError(err instanceof Error ? err.message : 'Failed to search generic names')
      } finally {
        if (!cancelled && requestId === requestIdRef.current) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  const hasMore = useMemo(
    () =>
      canLoadMore({
        suggestionsLength: suggestions.length,
        totalElements,
        page,
        totalPages,
        isLast,
      }),
    [suggestions.length, totalElements, page, totalPages, isLast],
  )

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return

    const {
      debouncedQuery: activeQuery,
      page: currentPage,
      suggestionsLength,
      totalElements: total,
      totalPages: pages,
      isLast: lastPage,
      loading: isLoading,
    } = stateRef.current

    const trimmed = activeQuery.trim()
    const nextPage = currentPage + 1
    const shouldLoad = canLoadMore({
      suggestionsLength,
      totalElements: total,
      page: currentPage,
      totalPages: pages,
      isLast: lastPage,
    })

    if (!trimmed || isLoading || !shouldLoad) return
    if (fetchingPageRef.current === nextPage) return

    fetchingPageRef.current = nextPage
    loadingMoreRef.current = true
    setLoadingMore(true)
    setError('')

    try {
      const payload = await fetchGenericNamesSearch({
        query: trimmed,
        page: nextPage,
        size: AUTocomplete_PAGE_SIZE,
      })
      const result = parseGenericNamesPage(payload)

      let mergedLength = suggestionsLength
      setSuggestions((prev) => {
        const merged = mergeGenericNameItems(prev, result.items)
        mergedLength = merged.length
        return merged
      })
      setTotalElements(result.totalElements)
      setTotalPages(result.totalPages)
      setIsLast(
        result.isLast === true ||
          result.items.length === 0 ||
          (result.totalElements > 0 && mergedLength >= result.totalElements) ||
          (result.totalPages > 0 && nextPage + 1 >= result.totalPages),
      )
      setPage(nextPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more generic names')
    } finally {
      if (fetchingPageRef.current === nextPage) fetchingPageRef.current = null
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [])

  return {
    debouncedQuery,
    suggestions,
    totalElements,
    totalPages,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  }
}

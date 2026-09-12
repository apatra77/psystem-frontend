import { useEffect, useRef, useState } from 'react'
import { useCatalogStore } from '@/app/store/catalogStore'
import { fetchCategories, fetchProductsSearchPage } from '@/services/products'

const SUGGESTION_DEBOUNCE_MS = 300
const SUGGESTION_PAGE_SIZE = 8

export function useProductSearchSuggestions(query = '') {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const requestIdRef = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(String(query ?? '').trim()), SUGGESTION_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setLoading(false)
      return undefined
    }

    const requestId = ++requestIdRef.current
    let cancelled = false

    ;(async () => {
      setLoading(true)
      try {
        let categories = useCatalogStore.getState().categories
        if (!categories.length) {
          const fetched = await fetchCategories()
          if (fetched.length > 0) {
            useCatalogStore.getState().setCategoriesFromApi(fetched)
            categories = fetched
          }
        }

        const result = await fetchProductsSearchPage(trimmed, categories, {
          page: 0,
          size: SUGGESTION_PAGE_SIZE,
        })

        if (cancelled || requestId !== requestIdRef.current) return

        setSuggestions(result.products)
        useCatalogStore.getState().mergeProducts(result.products)
      } catch {
        if (cancelled || requestId !== requestIdRef.current) return
        setSuggestions([])
      } finally {
        if (!cancelled && requestId === requestIdRef.current) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  const isPending = query.trim().length >= 2 && debouncedQuery !== query.trim()

  return {
    suggestions,
    loading: loading || isPending,
    hasQuery: query.trim().length >= 2,
  }
}

export default useProductSearchSuggestions

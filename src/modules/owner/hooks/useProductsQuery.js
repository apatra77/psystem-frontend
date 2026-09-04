import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchCategories,
  fetchProductsByCategoryPage,
  fetchProductsPage,
  fetchProductsSearch,
  OWNER_PRODUCTS_PAGE_SIZE,
} from '@/services/products'

const SEARCH_DEBOUNCE_MS = 350

export function useProductsQuery({
  categoryId = 'all',
  searchQuery = '',
  refreshKey = 0,
  pageSize = OWNER_PRODUCTS_PAGE_SIZE,
}) {
  const [products, setProducts] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const skipInitialSearchDebounceRef = useRef(true)
  const categoriesRef = useRef([])

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
  }, [categoryId, debouncedSearch, pageSize])

  const trimmedSearch = debouncedSearch.trim()
  const isSearchMode = Boolean(trimmedSearch)

  const fetchProductsList = useCallback(
    async (force = false) => {
      setLoading(true)
      setError('')

      let cats = categoriesRef.current
      if (cats.length === 0) {
        try {
          cats = await fetchCategories({ force })
          categoriesRef.current = cats
          setCategories(cats)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load categories')
          setProducts([])
          setTotalElements(0)
          setTotalPages(1)
          setLoading(false)
          return
        }
      }

      try {
        if (isSearchMode) {
          const list = await fetchProductsSearch(trimmedSearch, cats)
          setProducts(list)
          setTotalElements(list.length)
          setTotalPages(1)
          setError('')
          return
        }

        const result =
          categoryId === 'all'
            ? await fetchProductsPage(cats, {
                page: page - 1,
                size: pageSize,
                force,
              })
            : await fetchProductsByCategoryPage(categoryId, cats, {
                page: page - 1,
                size: pageSize,
                force,
              })

        setProducts(result.products)
        setTotalElements(result.totalElements)
        setTotalPages(result.totalPages)
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
        setProducts([])
        setTotalElements(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    },
    [categoryId, isSearchMode, page, pageSize, trimmedSearch],
  )

  useEffect(() => {
    fetchProductsList()
  }, [fetchProductsList, refreshKey])

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages))
  }, [page, totalPages])

  const currentPage = Math.min(page, totalPages)
  const rangeStart = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = isSearchMode ? totalElements : Math.min(currentPage * pageSize, totalElements)

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, '…', totalPages]
    if (currentPage >= totalPages - 2) return [1, '…', totalPages - 2, totalPages - 1, totalPages]
    return [1, '…', currentPage, '…', totalPages]
  }, [currentPage, totalPages])

  const refetch = useCallback(() => fetchProductsList(true), [fetchProductsList])

  const updateProductLocally = useCallback((id, updater) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== id) return product
        return typeof updater === 'function' ? updater(product) : { ...product, ...updater }
      }),
    )
  }, [])

  const removeProductLocally = useCallback((id) => {
    setProducts((prev) => prev.filter((product) => product.id !== id))
    setTotalElements((prev) => Math.max(0, prev - 1))
  }, [])

  return {
    products,
    categories,
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
    isSearchMode,
    refetch,
    updateProductLocally,
    removeProductLocally,
  }
}

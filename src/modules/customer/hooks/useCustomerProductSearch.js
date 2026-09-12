import { useEffect, useMemo, useState } from 'react'
import { useCatalogStore } from '@/app/store/catalogStore'
import {
  fetchCategories,
  fetchProductsSearchPage,
  OWNER_PRODUCTS_PAGE_SIZE,
} from '@/services/products'

export function useCustomerProductSearch(searchQuery, { page = 1, pageSize = OWNER_PRODUCTS_PAGE_SIZE } = {}) {
  const [products, setProducts] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const trimmed = searchQuery.trim()
  const isSearchMode = trimmed.length > 0

  useEffect(() => {
    if (!isSearchMode) {
      setProducts([])
      setTotalElements(0)
      setTotalPages(1)
      setError('')
      setLoading(false)
      return undefined
    }

    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError('')

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
          page: Math.max(0, page - 1),
          size: pageSize,
        })

        if (cancelled) return

        setProducts(result.products)
        setTotalElements(result.totalElements)
        setTotalPages(Math.max(1, result.totalPages))
        useCatalogStore.getState().mergeProducts(result.products)
      } catch (err) {
        if (cancelled) return
        setProducts([])
        setTotalElements(0)
        setTotalPages(1)
        setError(err instanceof Error ? err.message : 'Failed to search products')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [trimmed, page, pageSize, isSearchMode])

  const currentPage = Math.min(page, totalPages)
  const rangeStart = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalElements)

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, '…', totalPages]
    if (currentPage >= totalPages - 2) return [1, '…', totalPages - 2, totalPages - 1, totalPages]
    return [1, '…', currentPage, '…', totalPages]
  }, [currentPage, totalPages])

  return {
    products,
    totalElements,
    totalPages,
    currentPage,
    rangeStart,
    rangeEnd,
    pageNumbers,
    loading,
    error,
    isSearchMode,
  }
}

export default useCustomerProductSearch

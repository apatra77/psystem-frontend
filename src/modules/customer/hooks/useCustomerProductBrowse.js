import { useEffect, useMemo, useState } from 'react'
import { useCatalogStore } from '@/app/store/catalogStore'
import {
  fetchCategories,
  fetchCustomerProductsByCategoryPage,
  fetchCustomerProductsPage,
  OWNER_PRODUCTS_PAGE_SIZE,
} from '@/services/products'

export function useCustomerProductBrowse({ page = 1, categorySlug = '', enabled = true, refreshKey = 0 } = {}) {
  const [products, setProducts] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled) {
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
        const fetchedCategories = await fetchCategories()
        let categories = fetchedCategories

        if (fetchedCategories.length > 0) {
          useCatalogStore.getState().setCategoriesFromApi(fetchedCategories)
        } else {
          categories = useCatalogStore.getState().categories
        }

        if (categorySlug) {
          const category = categories.find((item) => item.slug === categorySlug)
          if (!category) {
            if (cancelled) return
            setProducts([])
            setTotalElements(0)
            setTotalPages(1)
            setError('Category not found')
            return
          }

          const result = await fetchCustomerProductsByCategoryPage(category.id, categories, {
            page: Math.max(0, page - 1),
            size: OWNER_PRODUCTS_PAGE_SIZE,
          })

          if (cancelled) return

          setProducts(result.products)
          setTotalElements(result.totalElements)
          setTotalPages(Math.max(1, result.totalPages))
          useCatalogStore.getState().mergeProducts(result.products)
          return
        }

        const result = await fetchCustomerProductsPage(categories, {
          page: Math.max(0, page - 1),
          size: OWNER_PRODUCTS_PAGE_SIZE,
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
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [page, categorySlug, enabled, refreshKey])

  const currentPage = Math.min(page, totalPages)
  const rangeStart = totalElements === 0 ? 0 : (currentPage - 1) * OWNER_PRODUCTS_PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * OWNER_PRODUCTS_PAGE_SIZE, totalElements)

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
  }
}

export default useCustomerProductBrowse

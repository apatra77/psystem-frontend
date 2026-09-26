import { useEffect, useMemo, useState } from 'react'
import { useCatalogStore } from '@/app/store/catalogStore'
import {
  fetchCategories,
  fetchCustomerProductsByCategoryPage,
  fetchCustomerProductsByGroupNamePage,
  fetchCustomerProductsInStockAll,
  fetchCustomerProductsPage,
  OWNER_PRODUCTS_PAGE_SIZE,
} from '@/services/products'

export function useCustomerProductBrowse({
  page = 1,
  categorySlug = '',
  groupName = '',
  inStockOnly = false,
  enabled = true,
  refreshKey = 0,
} = {}) {
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

        const apiPage = Math.max(0, page - 1)
        const pageSize = OWNER_PRODUCTS_PAGE_SIZE
        const forceRefresh = refreshKey > 0

        if (inStockOnly) {
          const allProducts = await fetchCustomerProductsInStockAll(categories, { force: forceRefresh })
          if (cancelled) return

          const total = allProducts.length
          const totalPagesCount = Math.max(1, Math.ceil(total / pageSize))
          const safePage = Math.min(page, totalPagesCount)
          const start = (safePage - 1) * pageSize
          const pageProducts = allProducts.slice(start, start + pageSize)

          setProducts(pageProducts)
          setTotalElements(total)
          setTotalPages(totalPagesCount)
          useCatalogStore.getState().mergeProducts(allProducts)
          return
        }

        if (groupName) {
          const result = await fetchCustomerProductsByGroupNamePage(groupName, categories, {
            page: apiPage,
            size: pageSize,
            force: forceRefresh,
          })

          if (cancelled) return

          setProducts(result.products)
          setTotalElements(result.totalElements)
          setTotalPages(Math.max(1, result.totalPages))
          useCatalogStore.getState().mergeProducts(result.products)
          return
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
            page: apiPage,
            size: pageSize,
            force: forceRefresh,
          })

          if (cancelled) return

          setProducts(result.products)
          setTotalElements(result.totalElements)
          setTotalPages(Math.max(1, result.totalPages))
          useCatalogStore.getState().mergeProducts(result.products)
          return
        }

        const result = await fetchCustomerProductsPage(categories, {
          page: apiPage,
          size: pageSize,
          force: forceRefresh,
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
  }, [page, categorySlug, groupName, inStockOnly, enabled, refreshKey])

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

import { useCallback, useEffect, useState } from 'react'
import { fetchCategories } from '@/services/products'

/** Loads GET /api/categories for the admin Categories page. */
export function useAdminCategoriesQuery() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetchCategories = useCallback(async ({ force = false } = {}) => {
    setLoading(true)
    setError('')

    try {
      const items = await fetchCategories({ force })
      setCategories(Array.isArray(items) ? items : [])
      return items
    } catch (err) {
      setCategories([])
      setError(err instanceof Error ? err.message : 'Failed to load categories')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetchCategories()
  }, [refetchCategories])

  return {
    categories,
    loading,
    error,
    refetchCategories,
    setCategories,
  }
}

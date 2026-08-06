import { create } from 'zustand'
import { CATEGORIES, PRODUCTS } from '@/shared/mocks/catalog'
import { memoizeDerived } from './memoize'

const DEFAULT_FILTERS = {
  query: '',
  category: 'all',
  brands: [],
  minPrice: 0,
  maxPrice: 5000,
  minRating: 0,
  rxOnly: false,
  inStockOnly: false,
  sort: 'relevance',
}

const etaMinutes = (eta) => Number(String(eta).match(/\d+/)?.[0] ?? 999)

/**
 * Filtering + sorting, memoised on (products, filters) so `results()` hands back
 * the same array reference until one of them actually changes. Without this,
 * `useCatalogStore((s) => s.results())` re-renders forever — see ./memoize.
 */
const computeResults = memoizeDerived((products, f) => {
  const q = f.query.trim().toLowerCase()
  const list = products.filter((p) => {
    if (q && !`${p.name} ${p.brand} ${p.desc}`.toLowerCase().includes(q)) return false
    if (f.category !== 'all' && p.cat !== f.category) return false
    if (f.brands.length && !f.brands.includes(p.brand)) return false
    if (p.price < f.minPrice || p.price > f.maxPrice) return false
    if (p.rating < f.minRating) return false
    if (f.rxOnly && !p.rx) return false
    if (f.inStockOnly && p.stock <= 0) return false
    return true
  })

  const sorted = [...list]
  if (f.sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
  if (f.sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
  if (f.sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
  if (f.sort === 'eta') sorted.sort((a, b) => etaMinutes(a.eta) - etaMinutes(b.eta))
  return sorted
})

/** Catalog + search filters. Swap the arrays for API results without touching the pages. */
export const useCatalogStore = create((set, get) => ({
  products: PRODUCTS,
  categories: CATEGORIES,
  wishlist: [],
  filters: { ...DEFAULT_FILTERS },
  loading: false,

  setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  toggleBrand: (brand) =>
    set((s) => ({
      filters: {
        ...s.filters,
        brands: s.filters.brands.includes(brand)
          ? s.filters.brands.filter((b) => b !== brand)
          : [...s.filters.brands, brand],
      },
    })),

  toggleWishlist: (id) =>
    set((s) => ({ wishlist: s.wishlist.includes(id) ? s.wishlist.filter((w) => w !== id) : [...s.wishlist, id] })),

  getProduct: (id) => get().products.find((p) => p.id === id) ?? null,

  results: () => computeResults(get().products, get().filters),
}))

export default useCatalogStore

import { create } from 'zustand'
import { PRODUCTS, SORT_OPTIONS } from '@/shared/mocks/catalog'
import { PAGE_SIZE } from '@/app/constants/app'

const DEFAULT_FILTERS = {
  query: '', category: 'all', brands: [], minPrice: 0, maxPrice: 5000,
  minRating: 0, minDiscount: 0, maxEta: 0, rxOnly: false, inStockOnly: false, sort: 'relevance',
}

const etaMinutes = (eta) => Number(String(eta).match(/\d+/)?.[0] ?? 999)
const discountOf = (p) => (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0)

/**
 * Product catalogue, filtering, sorting and pagination.
 * Pages read `results()` / `paged()` — swap `items` for API data and nothing else changes.
 */
export const useProductStore = create((set, get) => ({
  items: PRODUCTS,
  sortOptions: SORT_OPTIONS,
  filters: { ...DEFAULT_FILTERS },
  page: 1,
  pageSize: PAGE_SIZE,
  loading: false,

  setItems: (items) => set({ items }),
  setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch }, page: 1 })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS }, page: 1 }),
  setPage: (page) => set({ page }),
  nextPage: () => set((s) => ({ page: s.page + 1 })),

  toggleBrand: (brand) =>
    set((s) => ({
      page: 1,
      filters: {
        ...s.filters,
        brands: s.filters.brands.includes(brand)
          ? s.filters.brands.filter((b) => b !== brand)
          : [...s.filters.brands, brand],
      },
    })),

  getById: (id) => get().items.find((p) => p.id === id) ?? null,
  related: (product, limit = 4) =>
    get().items.filter((p) => p.cat === product?.cat && p.id !== product?.id).slice(0, limit),

  results: () => {
    const { items, filters: f } = get()
    const q = f.query.trim().toLowerCase()
    const list = items.filter((p) => {
      if (q && !`${p.name} ${p.brand} ${p.desc}`.toLowerCase().includes(q)) return false
      if (f.category !== 'all' && p.cat !== f.category) return false
      if (f.brands.length && !f.brands.includes(p.brand)) return false
      if (p.price < f.minPrice || p.price > f.maxPrice) return false
      if (p.rating < f.minRating) return false
      if (discountOf(p) < f.minDiscount) return false
      if (f.maxEta && etaMinutes(p.eta) > f.maxEta) return false
      if (f.rxOnly && !p.rx) return false
      if (f.inStockOnly && p.stock <= 0) return false
      return true
    })
    const sorted = [...list]
    if (f.sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
    if (f.sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
    if (f.sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
    if (f.sort === 'discount') sorted.sort((a, b) => discountOf(b) - discountOf(a))
    if (f.sort === 'eta') sorted.sort((a, b) => etaMinutes(a.eta) - etaMinutes(b.eta))
    return sorted
  },

  /** Slice used by paginated grids; infinite scroll just increments `page`. */
  paged: () => {
    const { page, pageSize } = get()
    return get().results().slice(0, page * pageSize)
  },

  totalPages: () => Math.ceil(get().results().length / get().pageSize) || 1,
  hasMore: () => get().paged().length < get().results().length,

  featured: (limit = 8) => [...get().items].sort((a, b) => b.reviews - a.reviews).slice(0, limit),
  bestSellers: (limit = 6) => [...get().items].sort((a, b) => b.rating - a.rating).slice(0, limit),
  newArrivals: (limit = 6) => get().items.slice(-limit).reverse(),
  onOffer: (limit = 6) => [...get().items].sort((a, b) => discountOf(b) - discountOf(a)).slice(0, limit),
}))

export const selectFilters = (s) => s.filters
export default useProductStore

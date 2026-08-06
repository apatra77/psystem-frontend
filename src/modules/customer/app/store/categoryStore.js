import { create } from 'zustand'
import { BRANDS, CATEGORIES } from '@/shared/mocks/catalog'

/** Categories and brands used by the storefront nav and the filter rail. */
export const useCategoryStore = create((set, get) => ({
  categories: CATEGORIES,
  brands: BRANDS,
  loading: false,

  setCategories: (categories) => set({ categories }),
  getBySlug: (slug) => get().categories.find((c) => c.slug === slug) ?? null,
  getById: (id) => get().categories.find((c) => c.id === id) ?? null,
  nameOf: (slug) => get().getBySlug(slug)?.name ?? slug,
}))

export default useCategoryStore

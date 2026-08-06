import { create } from 'zustand'

/**
 * Reference-counted global loading. Services call start/stop around requests so
 * overlapping calls don't flicker the spinner off early.
 */
export const useLoadingStore = create((set, get) => ({
  counters: {},

  start: (key = 'global') => set((s) => ({ counters: { ...s.counters, [key]: (s.counters[key] ?? 0) + 1 } })),
  stop: (key = 'global') =>
    set((s) => {
      const next = Math.max((s.counters[key] ?? 1) - 1, 0)
      const counters = { ...s.counters }
      if (next === 0) delete counters[key]
      else counters[key] = next
      return { counters }
    }),

  isLoading: (key = 'global') => (get().counters[key] ?? 0) > 0,
  isBusy: () => Object.keys(get().counters).length > 0,

  /** Wrap any promise: `await withLoading('products', () => productService.list())` */
  withLoading: async (key, fn) => {
    get().start(key)
    try {
      return await fn()
    } finally {
      get().stop(key)
    }
  },
}))

export const selectIsLoading = (key) => (s) => (s.counters[key] ?? 0) > 0
export default useLoadingStore

import { create } from 'zustand'
import { SEARCH_HISTORY_LIMIT } from '@/app/constants/app'

/**
 * Search box state: term, suggestions and recent searches.
 * History is in memory only (no storage), so it lives for the session.
 */
export const useSearchStore = create((set, get) => ({
  term: '',
  suggestions: [],
  history: [],
  searching: false,

  setTerm: (term) => set({ term }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setSearching: (searching) => set({ searching }),

  commit: (term) => {
    const value = String(term ?? '').trim()
    if (!value) return
    set((s) => ({
      term: value,
      history: [value, ...s.history.filter((h) => h.toLowerCase() !== value.toLowerCase())].slice(0, SEARCH_HISTORY_LIMIT),
    }))
  },

  removeFromHistory: (term) => set((s) => ({ history: s.history.filter((h) => h !== term) })),
  clearHistory: () => set({ history: [] }),
  hasHistory: () => get().history.length > 0,
}))

export default useSearchStore

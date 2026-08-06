import { create } from 'zustand'
import { INITIAL_NOTIFICATIONS } from '@/shared/mocks/customer'

/** In-app notification centre (order updates, offers, system messages). */
export const useNotificationStore = create((set, get) => ({
  items: INITIAL_NOTIFICATIONS,
  filter: 'all', // all | unread | orders | offers

  setFilter: (filter) => set({ filter }),

  push: (notification) =>
    set((s) => ({
      items: [{ id: `n${Date.now()}`, at: new Date().toISOString(), read: false, ...notification }, ...s.items],
    })),

  markRead: (id) => set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllRead: () => set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
  remove: (id) => set((s) => ({ items: s.items.filter((n) => n.id !== id) })),
  clear: () => set({ items: [] }),

  unreadCount: () => get().items.filter((n) => !n.read).length,
  visible: () => {
    const { items, filter } = get()
    if (filter === 'unread') return items.filter((n) => !n.read)
    if (filter === 'all') return items
    return items.filter((n) => n.type === filter)
  },
}))

export const selectUnreadCount = (s) => s.items.filter((n) => !n.read).length
export default useNotificationStore

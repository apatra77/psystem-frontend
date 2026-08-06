import { create } from 'zustand'

let counter = 0
const nextId = () => `t${++counter}`

/** Toasts, global confirm dialog and layout chrome. */
export const useUiStore = create((set, get) => ({
  toasts: [],
  sidebarCollapsed: false,
  confirm: null, // { title, message, confirmLabel, onConfirm }

  toast: (message, tone = 'info', ttl = 4000) => {
    const id = nextId()
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }))
    if (ttl) setTimeout(() => get().dismissToast(id), ttl)
    return id
  },
  success: (message) => get().toast(message, 'success'),
  error: (message) => get().toast(message, 'error', 6000),
  info: (message) => get().toast(message, 'info'),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),

  askConfirm: (config) => set({ confirm: config }),
  closeConfirm: () => set({ confirm: null }),
}))

export const toast = {
  success: (m) => useUiStore.getState().success(m),
  error: (m) => useUiStore.getState().error(m),
  info: (m) => useUiStore.getState().info(m),
}

export default useUiStore

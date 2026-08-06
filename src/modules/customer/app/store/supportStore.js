import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import { INITIAL_COMPLAINTS, SUPPORT_THREADS } from '@/shared/mocks/customer'

/** Tickets, complaints and chat threads (store + delivery partner). */
export const useSupportStore = create((set, get) => ({
  tickets: INITIAL_COMPLAINTS,
  threads: SUPPORT_THREADS,
  messages: {}, // threadId -> message[]
  activeThreadId: null,

  setActiveThread: (id) => set({ activeThreadId: id }),
  getThread: (id) => get().threads.find((t) => t.id === id) ?? null,
  getMessages: (id) => get().messages[id] ?? [],

  raiseTicket: (draft) => {
    const ticket = {
      ...draft,
      id: `CMP-${Math.floor(Math.random() * 9000 + 1000)}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ tickets: [ticket, ...s.tickets] }))
    toast.success(msg('customer.complaintRaised', { id: ticket.id }))
    return ticket
  },

  closeTicket: (id) => set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, status: 'resolved' } : t)) })),

  sendMessage: (threadId, text, from = 'me') =>
    set((s) => {
      const list = s.messages[threadId] ?? []
      return {
        messages: { ...s.messages, [threadId]: [...list, { id: `m${list.length + 1}`, from, text, at: new Date().toISOString() }] },
        threads: s.threads.map((t) => (t.id === threadId ? { ...t, last: text, at: new Date().toISOString() } : t)),
      }
    }),
}))

export default useSupportStore

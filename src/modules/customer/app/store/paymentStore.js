import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import { INITIAL_PAYMENT_METHODS } from '@/shared/mocks/customer'
import { PAYMENT_METHODS } from '@/shared/mocks/pricing'

const uid = () => `pm${Date.now().toString().slice(-6)}`

/** Saved instruments + the state machine for a single payment attempt. */
export const usePaymentStore = create((set, get) => ({
  methods: INITIAL_PAYMENT_METHODS,
  channels: PAYMENT_METHODS,
  selectedChannel: 'upi',
  status: 'idle', // idle | processing | success | failed
  transaction: null,
  transactions: [],
  error: null,

  selectChannel: (id) => set({ selectedChannel: id }),

  save: (draft) => {
    const record = { ...draft, id: draft.id || uid() }
    set((s) => ({
      methods: s.methods.some((m) => m.id === record.id)
        ? s.methods.map((m) => (m.id === record.id ? record : m))
        : [...s.methods, record],
    }))
    toast.success(msg('customer.paymentMethodSaved'))
    return record
  },

  remove: (id) => set((s) => ({ methods: s.methods.filter((m) => m.id !== id) })),

  /**
   * Kicks off a payment. Replace the timeout with the gateway SDK/redirect;
   * the surrounding status machine and the pages stay identical.
   */
  pay: async ({ orderId, amount, channel }) => {
    set({ status: 'processing', error: null })
    try {
      await new Promise((resolve) => setTimeout(resolve, 900))
      const transaction = {
        id: `TXN-${Math.floor(Math.random() * 900000 + 100000)}`,
        orderId,
        amount,
        channel: channel ?? get().selectedChannel,
        status: 'success',
        at: new Date().toISOString(),
      }
      set((s) => ({ status: 'success', transaction, transactions: [transaction, ...s.transactions] }))
      toast.success(msg('payment.success', { id: transaction.id }))
      return transaction
    } catch (error) {
      set({ status: 'failed', error: error.message })
      toast.error(msg('payment.failed'))
      throw error
    }
  },

  retry: (payload) => get().pay(payload),
  reset: () => set({ status: 'idle', transaction: null, error: null }),
}))

export default usePaymentStore

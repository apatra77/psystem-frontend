import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import { INITIAL_ADDRESSES } from '@/shared/mocks/customer'

const uid = () => `a${Date.now().toString().slice(-6)}`

/** Delivery addresses. Exactly one can be default; the setter enforces that. */
export const useAddressStore = create((set, get) => ({
  addresses: INITIAL_ADDRESSES,
  selectedId: INITIAL_ADDRESSES.find((a) => a.isDefault)?.id ?? null,
  loading: false,

  select: (id) => set({ selectedId: id }),
  getById: (id) => get().addresses.find((a) => a.id === id) ?? null,
  getDefault: () => get().addresses.find((a) => a.isDefault) ?? get().addresses[0] ?? null,

  save: (draft) => {
    const record = { ...draft, id: draft.id || uid() }
    set((s) => ({
      addresses: (s.addresses.some((a) => a.id === record.id)
        ? s.addresses.map((a) => (a.id === record.id ? record : a))
        : [...s.addresses, record]
      ).map((a) => (record.isDefault && a.id !== record.id ? { ...a, isDefault: false } : a)),
    }))
    toast.success(msg('customer.addressSaved'))
    return record
  },

  setDefault: (id) => {
    set((s) => ({ addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })), selectedId: id }))
    toast.success(msg('customer.addressSaved'))
  },

  remove: (id) => {
    set((s) => ({
      addresses: s.addresses.filter((a) => a.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
    toast.info(msg('customer.addressDeleted'))
  },
}))

export default useAddressStore

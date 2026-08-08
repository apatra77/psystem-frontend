import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import {
  CANCEL_WINDOW_MINUTES,
  INITIAL_ADDRESSES,
  INITIAL_COMPLAINTS,
  INITIAL_CUSTOMER_ORDERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_PRESCRIPTIONS,
} from '@/shared/mocks/customer'

const uid = (prefix) => `${prefix}${Date.now().toString().slice(-6)}`

/** Everything a signed-in customer owns: orders, addresses, payment methods, prescriptions, tickets. */
export const useOrderStore = create((set, get) => ({
  orders: INITIAL_CUSTOMER_ORDERS,
  addresses: INITIAL_ADDRESSES,
  paymentMethods: INITIAL_PAYMENT_METHODS,
  prescriptions: INITIAL_PRESCRIPTIONS,
  complaints: INITIAL_COMPLAINTS,
  notifications: INITIAL_NOTIFICATIONS,

  getOrder: (id) => get().orders.find((o) => o.id === id) ?? null,

  placeOrder: ({ items, totals, address, paymentMethod, scheduledFor, prescriptionId }) => {
    const order = {
      id: `MQ-${Math.floor(Math.random() * 90000 + 10000)}`,
      placedAt: new Date().toISOString(),
      status: 'placed',
      paymentMethod,
      address,
      scheduledFor: scheduledFor ?? null,
      prescriptionId: prescriptionId ?? null,
      rider: null,
      items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
      total: totals.total,
    }
    set((s) => ({ orders: [order, ...s.orders] }))
    toast.success(msg('customer.orderPlaced', { id: order.id }))
    return order
  },

  canCancel: (order) => {
    if (!order || ['delivered', 'cancelled', 'out_for_delivery'].includes(order.status)) return false
    const minutes = (Date.now() - new Date(order.placedAt).getTime()) / 60000
    return minutes <= CANCEL_WINDOW_MINUTES
  },

  cancelOrder: (id) => {
    const order = get().getOrder(id)
    if (!get().canCancel(order)) {
      toast.error(msg('customer.orderCancelWindowClosed'))
      return false
    }
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o)) }))
    toast.success(msg('customer.orderCancelled', { id }))
    return true
  },

  saveAddress: (draft) => {
    const record = { ...draft, id: draft.id || uid('a') }
    set((s) => ({
      addresses: (s.addresses.some((a) => a.id === record.id)
        ? s.addresses.map((a) => (a.id === record.id ? record : a))
        : [...s.addresses, record]
      ).map((a) => (record.isDefault && a.id !== record.id ? { ...a, isDefault: false } : a)),
    }))
    toast.success(msg('customer.addressSaved'))
    return record
  },
  setAddressesFromApi: (incoming) => set({ addresses: Array.isArray(incoming) ? incoming : [] }),
  deleteAddress: (id) => {
    set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) }))
    toast.info(msg('customer.addressDeleted'))
  },

  savePaymentMethod: (draft) => {
    const record = { ...draft, id: draft.id || uid('pm') }
    set((s) => ({
      paymentMethods: s.paymentMethods.some((p) => p.id === record.id)
        ? s.paymentMethods.map((p) => (p.id === record.id ? record : p))
        : [...s.paymentMethods, record],
    }))
    toast.success(msg('customer.paymentMethodSaved'))
  },
  deletePaymentMethod: (id) => set((s) => ({ paymentMethods: s.paymentMethods.filter((p) => p.id !== id) })),

  addPrescription: ({ fileName, note }) => {
    const record = { id: uid('rx'), fileName, note: note ?? '', uploadedAt: new Date().toISOString(), status: 'under_review' }
    set((s) => ({ prescriptions: [record, ...s.prescriptions] }))
    toast.success(msg('customer.prescriptionUploaded'))
    return record
  },

  raiseComplaint: (draft) => {
    const record = { ...draft, id: `CMP-${Math.floor(Math.random() * 9000 + 1000)}`, status: 'open', createdAt: new Date().toISOString() }
    set((s) => ({ complaints: [record, ...s.complaints] }))
    toast.success(msg('customer.complaintRaised', { id: record.id }))
    return record
  },

  markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}))

export default useOrderStore

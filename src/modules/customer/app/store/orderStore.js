import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import { cancelCustomerOrder } from '@/services/orders'
import { isOrderInitiated } from '@/modules/customer/utils/orderHelpers'
import {
  INITIAL_COMPLAINTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_PRESCRIPTIONS,
} from '@/shared/mocks/customer'

const uid = (prefix) => `${prefix}${Date.now().toString().slice(-6)}`

/** Everything a signed-in customer owns: orders, addresses, payment methods, prescriptions, tickets. */
export const useOrderStore = create((set, get) => ({
  orders: [],
  ordersLoadedFromApi: false,
  addresses: [],
  addressesLoadedFromApi: false,
  selectedAddressId: null,
  paymentMethods: INITIAL_PAYMENT_METHODS,
  prescriptions: INITIAL_PRESCRIPTIONS,
  complaints: INITIAL_COMPLAINTS,
  notifications: INITIAL_NOTIFICATIONS,

  getOrder: (id) => get().orders.find((o) => o.id === id) ?? null,

  getSelectedAddress: () => {
    const { addresses, selectedAddressId } = get()
    if (selectedAddressId) {
      return addresses.find((address) => address.id === selectedAddressId) ?? null
    }
    return addresses.find((address) => address.isDefault) ?? addresses[0] ?? null
  },

  selectDeliveryAddress: (id) => set({ selectedAddressId: id }),

  setOrdersFromApi: (incoming) =>
    set({
      orders: Array.isArray(incoming) ? incoming : [],
      ordersLoadedFromApi: true,
    }),

  placeOrder: ({ items, totals, address, addressDetails, paymentMethod, scheduledFor, prescriptionId, orderId, total }) => {
    const order = {
      id: orderId ?? `MQ-${Math.floor(Math.random() * 90000 + 10000)}`,
      placedAt: new Date().toISOString(),
      status: 'placed',
      paymentMethod,
      address,
      addressDetails: addressDetails ?? null,
      scheduledFor: scheduledFor ?? null,
      prescriptionId: prescriptionId ?? null,
      rider: null,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
        image: i.image ?? null,
      })),
      totals: totals ?? null,
      total: total ?? totals?.total ?? 0,
    }
    set((s) => ({ orders: [order, ...s.orders] }))
    toast.success(msg('customer.orderPlaced', { id: order.id }))
    return order
  },

  canCancel: (order) => isOrderInitiated(order),

  cancelOrder: async (id) => {
    const order = get().getOrder(id)
    if (!isOrderInitiated(order)) {
      toast.error(msg('customer.orderCancelWindowClosed'))
      throw new Error(msg('customer.orderCancelWindowClosed'))
    }

    try {
      await cancelCustomerOrder(id)
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id
            ? {
                ...o,
                status: 'cancelled',
                orderStatusDesc: 'Cancelled',
                statusUpdatedAt: new Date().toISOString(),
              }
            : o,
        ),
      }))
      toast.success(msg('customer.orderCancelled', { id }))
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel order')
      throw err
    }
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
  setAddressesFromApi: (incoming) =>
    set((state) => {
      const addresses = Array.isArray(incoming) ? incoming : []
      const selectedStillValid = addresses.some((address) => address.id === state.selectedAddressId)
      const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0] ?? null

      return {
        addresses,
        addressesLoadedFromApi: true,
        selectedAddressId: selectedStillValid ? state.selectedAddressId : (defaultAddress?.id ?? null),
      }
    }),
  deleteAddress: (id) => {
    set((s) => {
      const addresses = s.addresses.filter((a) => a.id !== id)
      const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null
      return {
        addresses,
        selectedAddressId: s.selectedAddressId === id ? (defaultAddress?.id ?? null) : s.selectedAddressId,
      }
    })
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

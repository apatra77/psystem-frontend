import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import { COUPONS, DELIVERY_FEE, FREE_DELIVERY_ABOVE, PACKAGING_FEE, TAX_RATE } from '@/shared/mocks/pricing'
import { memoizeDerived } from './memoize'

const round = (n) => Math.round(n * 100) / 100

/**
 * Bill maths, memoised on (items, coupon) so `totals()` returns the same object
 * reference until the cart actually changes. A fresh object here would make
 * `useCartStore((s) => s.totals())` loop forever — see ./memoize.
 */
const computeTotals = memoizeDerived((items, coupon) => {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const mrpTotal = items.reduce((sum, i) => sum + (i.mrp || i.price) * i.qty, 0)
  const couponDiscount = !coupon
    ? 0
    : coupon.type === 'percent'
      ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount ?? Infinity)
      : Math.min(coupon.value, subtotal)
  const taxable = Math.max(subtotal - couponDiscount, 0)
  const delivery = items.length === 0 || taxable >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE
  const packaging = items.length === 0 ? 0 : PACKAGING_FEE
  const tax = taxable * TAX_RATE

  return {
    subtotal: round(subtotal),
    savings: round(mrpTotal - subtotal),
    couponDiscount: round(couponDiscount),
    delivery: round(delivery),
    packaging: round(packaging),
    tax: round(tax),
    total: round(taxable + delivery + packaging + tax),
  }
})

/** Cart lives in memory for the session. Persist server-side via /api/cart when the endpoint exists. */
export const useCartStore = create((set, get) => ({
  items: [],
  coupon: null,
  scheduledFor: null,
  prescriptionId: null,

  addItem: (product, qty = 1) => {
    set((s) => {
      const existing = s.items.find((i) => i.id === product.id)
      return {
        items: existing
          ? s.items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i))
          : [
              ...s.items,
              {
                id: product.id,
                name: product.name,
                price: product.price,
                mrp: product.mrp ?? product.price,
                image: product.image ?? null,
                rx: !!product.rx,
                pack: product.pack ?? '',
                qty,
              },
            ],
      }
    })
    toast.success(msg('customer.addedToCart', { name: product.name }))
  },

  setQty: (id, qty) =>
    set((s) => ({
      items: qty <= 0 ? s.items.filter((i) => i.id !== id) : s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
    })),

  removeItem: (id) => {
    const item = get().items.find((i) => i.id === id)
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
    if (item) toast.info(msg('customer.removedFromCart', { name: item.name }))
  },

  clear: () => set({ items: [], coupon: null, scheduledFor: null, prescriptionId: null }),

  applyCoupon: (code) => {
    const found = COUPONS.find((c) => c.code.toUpperCase() === String(code).trim().toUpperCase())
    if (!found) {
      toast.error(msg('customer.couponInvalid'))
      return false
    }
    set({ coupon: found })
    toast.success(msg('customer.couponApplied', { code: found.code }))
    return true
  },
  removeCoupon: () => set({ coupon: null }),

  setSchedule: (iso) => set({ scheduledFor: iso }),
  setPrescription: (id) => set({ prescriptionId: id }),

  count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
  requiresPrescription: () => get().items.some((i) => i.rx),

  totals: () => computeTotals(get().items, get().coupon),
}))

export default useCartStore

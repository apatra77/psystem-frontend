import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import { COUPONS, DELIVERY_FEE, FREE_DELIVERY_ABOVE, PACKAGING_FEE } from '@/shared/mocks/pricing'
import { addCartItem, deleteCartItem, fetchMyCart, mapCartFromApi, mapCartItemFromApi, resolveCartItemId, updateCartItem } from '@/services/cart'
import { memoizeDerived } from './memoize'

const round = (n) => Math.round(n * 100) / 100

let inFlightLoadCart = null

const buildLocalItem = (product, qty, cartItemId = null) => ({
  id: String(product.id),
  cartItemId: cartItemId ? String(cartItemId) : null,
  name: product.name,
  price: product.price,
  mrp: product.mrp ?? product.price,
  image: product.image ?? product.imageUrl ?? null,
  rx: !!product.rx,
  pack: product.pack ?? '',
  qty,
})

async function resolveLineItemId(productId, postResponse = null) {
  if (postResponse) {
    const mapped = await resolveCartItemId(productId, postResponse)
    if (mapped.cartItemId) return mapped
  }

  const cart = await fetchMyCart()
  return mapCartItemFromApi(cart, productId)
}

function patchCartItemId(set, productId, cartItemId, quantity) {
  if (!cartItemId) return

  set((s) => ({
    items: s.items.map((i) =>
      String(i.id) === String(productId)
        ? {
            ...i,
            cartItemId: String(cartItemId),
            qty: quantity ?? i.qty,
          }
        : i,
    ),
  }))
}

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
  const delivery =
    items.length === 0 ? 0 : subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE
  const packaging = items.length === 0 ? 0 : PACKAGING_FEE

  return {
    subtotal: round(subtotal),
    savings: round(mrpTotal - subtotal),
    couponDiscount: round(couponDiscount),
    delivery: round(delivery),
    packaging: round(packaging),
    total: round(taxable + delivery + packaging),
  }
})

/** Cart synced with GET/POST/PUT /api/carts/me on load and quantity changes. */
export const useCartStore = create((set, get) => ({
  items: [],
  coupon: null,
  scheduledFor: null,
  prescriptionId: null,
  loading: false,

  loadCart: async ({ silent = false } = {}) => {
    if (inFlightLoadCart) return inFlightLoadCart

    if (!silent) set({ loading: true })

    inFlightLoadCart = (async () => {
      try {
        const payload = await fetchMyCart()
        set({ items: mapCartFromApi(payload), loading: false })
      } catch (error) {
        set({ loading: false })
        const message = error?.message ?? 'Could not load cart'
        if (/404|not found|empty/i.test(message)) {
          set({ items: [] })
          return
        }
        if (!silent) toast.error(message)
      } finally {
        inFlightLoadCart = null
      }
    })()

    return inFlightLoadCart
  },

  addItem: async (product, qty = 1) => {
    const productId = String(product.id)
    const existing = get().items.find((i) => String(i.id) === productId)
    if (existing) {
      await get().setQty(productId, existing.qty + qty)
      return
    }

    const previousItems = get().items
    set({ items: [...previousItems, buildLocalItem(product, qty)] })

    try {
      const response = await addCartItem({
        productId: product.id,
        quantity: qty,
        price: product.price,
      })
      const { cartItemId, quantity } = await resolveLineItemId(productId, response)

      if (!cartItemId) {
        throw new Error('Cart item id missing from server response')
      }

      patchCartItemId(set, productId, cartItemId, quantity ?? qty)
      toast.success(msg('customer.addedToCart', { name: product.name }))
    } catch (error) {
      set({ items: previousItems })
      toast.error(error?.message ?? 'Could not add item to cart')
    }
  },

  setQty: async (id, qty) => {
    const productId = String(id)
    const item = get().items.find((i) => String(i.id) === productId)
    if (!item) return

    const previousItems = get().items
    const nextQty = qty

    set((s) => ({
      items:
        nextQty <= 0
          ? s.items.filter((i) => String(i.id) !== productId)
          : s.items.map((i) => (String(i.id) === productId ? { ...i, qty: nextQty } : i)),
    }))

    try {
      let cartItemId = item.cartItemId

      if (!cartItemId) {
        const resolved = await resolveLineItemId(productId)
        cartItemId = resolved.cartItemId
        if (cartItemId) {
          patchCartItemId(set, productId, cartItemId, resolved.quantity ?? nextQty)
        }
      }

      if (!cartItemId) {
        throw new Error('Cart item id missing — could not update quantity')
      }

      if (nextQty <= 0) {
        await deleteCartItem(cartItemId)
        toast.info(msg('customer.removedFromCart', { name: item.name }))
        return
      }

      await updateCartItem(cartItemId, nextQty)
    } catch (error) {
      set({ items: previousItems })
      toast.error(error?.message ?? 'Could not update cart quantity')
    }
  },

  removeItem: async (id) => {
    const productId = String(id)
    const item = get().items.find((i) => String(i.id) === productId)
    if (!item) return

    let cartItemId = item.cartItemId
    if (!cartItemId) {
      const resolved = await resolveLineItemId(productId)
      cartItemId = resolved.cartItemId
    }

    if (!cartItemId) {
      throw new Error('Cart item id missing — could not remove item')
    }

    const previousItems = get().items
    set((s) => ({ items: s.items.filter((i) => String(i.id) !== productId) }))

    try {
      await deleteCartItem(cartItemId)
      toast.info(msg('customer.removedFromCart', { name: item.name }))
    } catch (error) {
      set({ items: previousItems })
      toast.error(error?.message ?? 'Could not remove item from cart')
      throw error
    }
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

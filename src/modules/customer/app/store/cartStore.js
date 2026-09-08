import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import { COUPONS, DELIVERY_FEE, FREE_DELIVERY_ABOVE, PACKAGING_FEE } from '@/shared/mocks/pricing'
import { addCartItem, deleteCartItem, fetchMyCart, mapCartItemFromApi, parseCartPayload, resolveCartItemId, updateCartItem } from '@/services/cart'
import { formatLooseCartSummary, getCartLineMrpTotal, getCartLineSubtotal, productAllowsLoose } from '@/modules/customer/utils/looseQuantity'
import { memoizeDerived } from './memoize'

const round = (n) => Math.round(n * 100) / 100

let inFlightLoadCart = null

const buildLocalItem = (product, qty, cartItemId = null, looseMeta = null) => {
  const base = {
    id: String(product.id),
    cartItemId: cartItemId ? String(cartItemId) : null,
    name: product.name,
    genericName: product.genericName ?? product.brand ?? '',
    price: product.price,
    mrp: product.mrp ?? product.price,
    image: product.image ?? product.imageUrl ?? null,
    rx: !!product.rx,
    pack: product.pack ?? '',
    unitsPerPack: product.unitsPerPack,
    packLabel: product.packLabel,
    unitLabel: product.unitLabel,
    looseSaleAllowed: productAllowsLoose(product),
    packBased: productAllowsLoose(product),
  }

  if (looseMeta) {
    return {
      ...base,
      looseSaleAllowed: true,
      looseQuantity: true,
      packBased: true,
      fullPackQty: looseMeta.fullPackQty,
      looseUnitQty: looseMeta.looseUnitQty,
      qty: looseMeta.totalUnits,
    }
  }

  return { ...base, qty, fullPackQty: qty, packBased: true }
}

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

function preserveCartItemOrder(previousItems, nextItems) {
  if (!previousItems.length) return nextItems

  const nextByCartItemId = new Map()
  const nextByProductId = new Map()
  for (const item of nextItems) {
    if (item.cartItemId) nextByCartItemId.set(String(item.cartItemId), item)
    nextByProductId.set(String(item.id), item)
  }

  const ordered = []
  const placed = new Set()

  for (const prev of previousItems) {
    const match =
      (prev.cartItemId && nextByCartItemId.get(String(prev.cartItemId))) ||
      nextByProductId.get(String(prev.id))
    if (!match) continue

    const key = String(match.cartItemId ?? match.id)
    if (placed.has(key)) continue
    ordered.push(match)
    placed.add(key)
  }

  for (const item of nextItems) {
    const key = String(item.cartItemId ?? item.id)
    if (!placed.has(key)) {
      ordered.push(item)
      placed.add(key)
    }
  }

  return ordered
}

async function refreshCartFromServer(set, get) {
  const payload = await fetchMyCart({ force: true })
  const { items, cartTotal, subtotal } = parseCartPayload(payload)
  const mergedItems = preserveCartItemOrder(get().items, items)
  set({ items: mergedItems, cartTotal, subtotal })
}

/**
 * Bill maths, memoised on (items, coupon) so `totals()` returns the same object
 * reference until the cart actually changes. A fresh object here would make
 * `useCartStore((s) => s.totals())` loop forever — see ./memoize.
 */
const computeTotals = memoizeDerived((items, coupon, cartTotal, subtotal) => {
  const computedSubtotal = items.reduce(
    (sum, i) => sum + (Number(i.lineTotal) || getCartLineSubtotal(i)),
    0,
  )
  const mrpTotal = items.reduce((sum, i) => sum + getCartLineMrpTotal(i), 0)
  const resolvedSubtotal = subtotal ?? cartTotal ?? computedSubtotal
  const couponDiscount = !coupon
    ? 0
    : coupon.type === 'percent'
      ? Math.min((resolvedSubtotal * coupon.value) / 100, coupon.maxDiscount ?? Infinity)
      : Math.min(coupon.value, resolvedSubtotal)
  const taxable = Math.max(resolvedSubtotal - couponDiscount, 0)
  const delivery =
    items.length === 0 ? 0 : resolvedSubtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE
  const packaging = items.length === 0 ? 0 : PACKAGING_FEE

  return {
    subtotal: round(resolvedSubtotal),
    savings: round(mrpTotal - resolvedSubtotal),
    couponDiscount: round(couponDiscount),
    delivery: round(delivery),
    packaging: round(packaging),
    total: round(taxable + delivery + packaging),
  }
})

/** Cart synced with GET/POST/PUT /api/carts/me on load and quantity changes. */
export const useCartStore = create((set, get) => ({
  items: [],
  cartTotal: null,
  subtotal: null,
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
        const { items, cartTotal, subtotal } = parseCartPayload(payload)
        const mergedItems = preserveCartItemOrder(get().items, items)
        set({ items: mergedItems, cartTotal, subtotal, loading: false })
      } catch (error) {
        set({ loading: false })
        const message = error?.message ?? 'Could not load cart'
        if (/404|not found|empty/i.test(message)) {
          set({ items: [], cartTotal: null, subtotal: null })
          return
        }
        if (!silent) toast.error(message)
      } finally {
        inFlightLoadCart = null
      }
    })()

    return inFlightLoadCart
  },

  addItem: async (product, qtyOrLoose = 1) => {
    const productId = String(product.id)
    const isLooseAdd = typeof qtyOrLoose === 'object' && qtyOrLoose?.loose === true
    const existing = get().items.find((i) => String(i.id) === productId)

    if (isLooseAdd) {
      const { fullPackQty, looseUnitQty, totalUnits } = qtyOrLoose

      if (!totalUnits) {
        if (existing) await get().removeItem(productId)
        return
      }

      const previousItems = get().items
      const looseMeta = { fullPackQty, looseUnitQty, totalUnits }
      const nextItems = existing
        ? previousItems.map((i) =>
            String(i.id) === productId ? buildLocalItem(product, totalUnits, i.cartItemId, looseMeta) : i,
          )
        : [...previousItems, buildLocalItem(product, totalUnits, null, looseMeta)]

      set({ items: nextItems })

      try {
        let cartItemId = existing?.cartItemId
        let quantity = totalUnits

        if (existing?.cartItemId) {
          await updateCartItem(existing.cartItemId, {
            packQuantity: fullPackQty,
            looseQuantity: looseUnitQty,
          })
        } else {
          const response = await addCartItem({
            productId: product.id,
            price: product.price,
            packQuantity: fullPackQty,
            looseQuantity: looseUnitQty,
          })
          const resolved = await resolveLineItemId(productId, response)
          cartItemId = resolved.cartItemId
          quantity = resolved.quantity ?? totalUnits
        }

        if (!cartItemId) {
          throw new Error('Cart item id missing from server response')
        }

        patchCartItemId(set, productId, cartItemId, quantity ?? totalUnits)
        await refreshCartFromServer(set, get)
        const summary = formatLooseCartSummary(
          get().items.find((i) => String(i.id) === productId) ??
            buildLocalItem(product, totalUnits, cartItemId, looseMeta),
        )
        toast.success(
          summary?.long
            ? `${product.name} added to cart — ${summary.long}`
            : msg('customer.addedToCart', { name: product.name }),
        )
      } catch (error) {
        set({ items: previousItems })
        toast.error(error?.message ?? 'Could not add item to cart')
      }
      return
    }

    const qty = Number(qtyOrLoose) || 1
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
      await refreshCartFromServer(set, get)
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
    if (item.looseQuantity) return

    const previousItems = get().items
    const nextQty = qty

    set((s) => ({
      items:
        nextQty <= 0
          ? s.items.filter((i) => String(i.id) !== productId)
          : s.items.map((i) =>
              String(i.id) === productId ? { ...i, qty: nextQty, fullPackQty: nextQty } : i,
            ),
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
        await refreshCartFromServer(set, get)
        toast.info(msg('customer.removedFromCart', { name: item.name }))
        return
      }

      const updatePayload = item.packBased
        ? { packQuantity: nextQty, looseQuantity: 0 }
        : { quantity: nextQty }

      await updateCartItem(cartItemId, updatePayload)
      await refreshCartFromServer(set, get)
    } catch (error) {
      set({ items: previousItems })
      toast.error(error?.message ?? 'Could not update cart quantity')
    }
  },

  setLooseQty: async (id, { fullPackQty, looseUnitQty, totalUnits }) => {
    const productId = String(id)
    const item = get().items.find((i) => String(i.id) === productId)
    if (!item) return

    if (!totalUnits) {
      await get().removeItem(productId)
      return
    }

    const product = {
      id: item.id,
      name: item.name,
      price: item.price,
      mrp: item.mrp,
      pack: item.pack,
      unitsPerPack: item.unitsPerPack,
      packLabel: item.packLabel,
      unitLabel: item.unitLabel,
      looseSaleAllowed: true,
      looseQuantity: true,
    }

    await get().addItem(product, {
      loose: true,
      fullPackQty,
      looseUnitQty,
      totalUnits,
    })
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
      await refreshCartFromServer(set, get)
      toast.info(msg('customer.removedFromCart', { name: item.name }))
    } catch (error) {
      set({ items: previousItems })
      toast.error(error?.message ?? 'Could not remove item from cart')
      throw error
    }
  },

  clear: () => set({ items: [], cartTotal: null, subtotal: null, coupon: null, scheduledFor: null, prescriptionId: null }),

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

  count: () => get().items.length,
  requiresPrescription: () => get().items.some((i) => i.rx),

  totals: () => computeTotals(get().items, get().coupon, get().cartTotal, get().subtotal),
}))

export default useCartStore

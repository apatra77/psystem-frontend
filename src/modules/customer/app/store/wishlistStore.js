import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import { useCartStore } from './cartStore'

/** Saved-for-later list. Ids only; product bodies come from the catalog store. */
export const useWishlistStore = create((set, get) => ({
  ids: [],

  has: (id) => get().ids.includes(id),

  toggle: (product) => {
    const exists = get().ids.includes(product.id)
    set((s) => ({ ids: exists ? s.ids.filter((i) => i !== product.id) : [product.id, ...s.ids] }))
    toast.info(msg(exists ? 'customer.wishlistRemoved' : 'customer.wishlistAdded', { name: product.name }))
  },

  remove: (id) => set((s) => ({ ids: s.ids.filter((i) => i !== id) })),
  clear: () => set({ ids: [] }),

  /** Move to cart and drop from the wishlist in one action. */
  moveToCart: (product, qty = 1) => {
    useCartStore.getState().addItem(product, qty)
    get().remove(product.id)
  },

  count: () => get().ids.length,
}))

export default useWishlistStore

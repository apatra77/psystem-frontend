import { create } from 'zustand'
import { msg } from '@/shared/messages/messages'
import { toast } from './uiStore'
import { COUPONS } from '@/shared/mocks/pricing'

/** Available coupons + the one currently applied. Cart totals read `applied`. */
export const useCouponStore = create((set, get) => ({
  available: COUPONS,
  applied: null,
  validating: false,

  setAvailable: (available) => set({ available }),

  validate: (code) => {
    const value = String(code ?? '').trim().toUpperCase()
    return get().available.find((c) => c.code.toUpperCase() === value) ?? null
  },

  apply: (code) => {
    const coupon = get().validate(code)
    if (!coupon) {
      toast.error(msg('customer.couponInvalid'))
      return null
    }
    set({ applied: coupon })
    toast.success(msg('customer.couponApplied', { code: coupon.code }))
    return coupon
  },

  remove: () => set({ applied: null }),
}))

export default useCouponStore

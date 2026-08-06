import http from './http.service'
import { ENDPOINTS } from '@/app/constants/api'

export const cartService = {
  get: () => http.get(ENDPOINTS.cart.root, {}, 'cart'),
  addItem: (productId, qty = 1) => http.post(ENDPOINTS.cart.root, { productId, qty }),
  updateItem: (productId, qty) => http.patch(`${ENDPOINTS.cart.root}/${productId}`, { qty }),
  removeItem: (productId) => http.delete(`${ENDPOINTS.cart.root}/${productId}`),
  clear: () => http.delete(ENDPOINTS.cart.root),
  applyCoupon: (code) => http.post(ENDPOINTS.cart.coupon, { code }),
  removeCoupon: () => http.delete(ENDPOINTS.cart.coupon),
}

export default cartService

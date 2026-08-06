import http from './http.service'
import { ENDPOINTS } from '@/app/constants/api'

export const userService = {
  getProfile: () => http.get(ENDPOINTS.user.profile, {}, 'profile'),
  updateProfile: (payload) => http.put(ENDPOINTS.user.profile, payload, {}, 'profile'),
  uploadAvatar: (file, onProgress) => {
    const form = new FormData()
    form.append('avatar', file)
    return http.upload(`${ENDPOINTS.user.profile}/avatar`, form, onProgress)
  },
  changePassword: (payload) => http.post(ENDPOINTS.auth.changePassword, payload),
  deleteAccount: (reason) => http.delete(ENDPOINTS.user.profile, { data: { reason } }),

  addresses: () => http.get(ENDPOINTS.user.addresses),
  saveAddress: (payload) =>
    payload.id
      ? http.put(`${ENDPOINTS.user.addresses}/${payload.id}`, payload)
      : http.post(ENDPOINTS.user.addresses, payload),
  removeAddress: (id) => http.delete(`${ENDPOINTS.user.addresses}/${id}`),

  wishlist: () => http.get(ENDPOINTS.user.wishlist),
  toggleWishlist: (productId) => http.post(ENDPOINTS.user.wishlist, { productId }),
  reviews: () => http.get(ENDPOINTS.user.reviews),
}

export default userService

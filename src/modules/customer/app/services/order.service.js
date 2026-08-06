import http from './http.service'
import { ENDPOINTS } from '@/app/constants/api'

export const orderService = {
  list: (params) => http.get(ENDPOINTS.orders.root, { params }, 'orders'),
  byId: (id) => http.get(`${ENDPOINTS.orders.root}/${id}`, {}, 'order'),
  place: (payload) => http.post(ENDPOINTS.orders.root, payload, {}, 'placeOrder'),
  cancel: (id, reason) => http.post(`${ENDPOINTS.orders.root}/${id}/cancel`, { reason }),
  modify: (id, payload) => http.patch(`${ENDPOINTS.orders.root}/${id}`, payload),
  reorder: (id) => http.post(`${ENDPOINTS.orders.root}/${id}/reorder`),
  track: (id) => http.get(ENDPOINTS.orders.track(id)),
  invoice: (id) => http.get(ENDPOINTS.orders.invoice(id), { responseType: 'blob' }),
}

export default orderService

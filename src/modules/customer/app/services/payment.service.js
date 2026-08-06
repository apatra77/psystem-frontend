import http from './http.service'
import { ENDPOINTS } from '@/app/constants/api'

export const paymentService = {
  initiate: (payload) => http.post(ENDPOINTS.payments.root, payload, {}, 'payment'),
  verify: (payload) => http.post(ENDPOINTS.payments.verify, payload, {}, 'payment'),
  methods: () => http.get(ENDPOINTS.payments.methods),
  saveMethod: (payload) => http.post(ENDPOINTS.payments.methods, payload),
  removeMethod: (id) => http.delete(`${ENDPOINTS.payments.methods}/${id}`),
  transactions: (params) => http.get(`${ENDPOINTS.payments.root}/transactions`, { params }),
}

export default paymentService

import http from './http.service'
import { ENDPOINTS } from '@/app/constants/api'

export const productService = {
  list: (params) => http.get(ENDPOINTS.catalog.products, { params }, 'products'),
  byId: (id) => http.get(`${ENDPOINTS.catalog.products}/${id}`, {}, 'product'),
  related: (id) => http.get(`${ENDPOINTS.catalog.products}/${id}/related`),
  reviews: (id, params) => http.get(`${ENDPOINTS.catalog.products}/${id}/reviews`, { params }),
  addReview: (id, payload) => http.post(`${ENDPOINTS.catalog.products}/${id}/reviews`, payload),
  search: (query, params) => http.get(ENDPOINTS.catalog.search, { params: { q: query, ...params } }, 'search'),
  suggestions: (query) => http.get(`${ENDPOINTS.catalog.search}/suggestions`, { params: { q: query } }),
}

export default productService

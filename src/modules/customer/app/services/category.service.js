import http from './http.service'
import { ENDPOINTS } from '@/app/constants/api'

export const categoryService = {
  list: () => http.get(ENDPOINTS.catalog.categories, {}, 'categories'),
  byId: (id) => http.get(`${ENDPOINTS.catalog.categories}/${id}`),
  brands: () => http.get(ENDPOINTS.catalog.brands, {}, 'brands'),
  create: (payload) => http.post(ENDPOINTS.catalog.categories, payload),
  update: (id, payload) => http.put(`${ENDPOINTS.catalog.categories}/${id}`, payload),
  remove: (id) => http.delete(`${ENDPOINTS.catalog.categories}/${id}`),
}

export default categoryService

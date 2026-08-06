import http from './http.service'
import { ENDPOINTS } from '@/app/constants/api'

export const prescriptionService = {
  list: () => http.get(ENDPOINTS.prescriptions, {}, 'prescriptions'),
  upload: (file, meta, onProgress) => {
    const form = new FormData()
    form.append('file', file)
    Object.entries(meta ?? {}).forEach(([k, v]) => form.append(k, v))
    return http.upload(ENDPOINTS.prescriptions, form, onProgress, 'prescriptionUpload')
  },
  replace: (id, file, onProgress) => {
    const form = new FormData()
    form.append('file', file)
    return http.upload(`${ENDPOINTS.prescriptions}/${id}`, form, onProgress)
  },
  remove: (id) => http.delete(`${ENDPOINTS.prescriptions}/${id}`),
}

export default prescriptionService

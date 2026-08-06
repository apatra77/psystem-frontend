import { apiClient } from '@/shared/api/axios'
import { useLoadingStore } from '@/app/store/loadingStore'

/**
 * Thin wrapper over the axios instance that also drives the global loading
 * counter. Services use this instead of touching axios directly.
 */
const run = async (key, promise) => {
  const { start, stop } = useLoadingStore.getState()
  if (key) start(key)
  try {
    return await promise
  } finally {
    if (key) stop(key)
  }
}

export const http = {
  get: (url, config = {}, key) => run(key, apiClient.get(url, config)),
  post: (url, data, config = {}, key) => run(key, apiClient.post(url, data, config)),
  put: (url, data, config = {}, key) => run(key, apiClient.put(url, data, config)),
  patch: (url, data, config = {}, key) => run(key, apiClient.patch(url, data, config)),
  delete: (url, config = {}, key) => run(key, apiClient.delete(url, config)),
  upload: (url, formData, onProgress, key) =>
    run(key, apiClient.post(url, formData, {
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / (e.total || 1))),
    })),
}

export default http

import axios from 'axios'
import { ENV } from '@/app/config/env'
import { msg } from '@/shared/messages/messages'
import { HTTP_STATUS, RETRYABLE_METHODS, RETRY_COUNT, RETRY_DELAY_MS } from '@/app/constants/api'
import { ApiError } from './ApiError'
import { getAccessToken, notifyForbidden, notifyUnauthorized } from './tokenBridge'

/**
 * Single axios instance for the whole app.
 * Authentication is Bearer access token only: the request interceptor below
 * attaches it, and a 401 tears the session down. There is no refresh call and
 * no retry-after-refresh branch — see tokenBridge for where the token lives.
 */
export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: { Accept: '*/*', 'Content-Type': 'application/json' },
})

/* ---------------- Request interceptor: token injection ---------------- */
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) delete config.headers['Content-Type']
  config.metadata = { ...(config.metadata ?? {}), startedAt: Date.now() }
  return config
})

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const shouldRetry = (error) => {
  const config = error.config ?? {}
  const method = (config.method ?? 'get').toUpperCase()
  if (!RETRYABLE_METHODS.includes(method)) return false
  if (config.__retryCount >= RETRY_COUNT) return false
  const status = error.response?.status
  // Network failures, timeouts and 5xx are worth retrying; 4xx never is.
  return !status || status >= HTTP_STATUS.SERVER_ERROR
}

/* ---------------- Response interceptor: unwrap + retry + error mapping ---------------- */
apiClient.interceptors.response.use(
  // Most endpoints answer `{ success, message, data }` — hand callers the useful part.
  (response) => {
    const body = response.data
    return body && typeof body === 'object' && 'data' in body ? body.data : body
  },
  async (error) => {
    const config = error.config ?? {}

    if (shouldRetry(error)) {
      config.__retryCount = (config.__retryCount ?? 0) + 1
      await wait(RETRY_DELAY_MS * config.__retryCount) // linear backoff
      return apiClient(config)
    }

    const status = error.response?.status ?? 0
    const payload = error.response?.data

    if (status === HTTP_STATUS.UNAUTHORIZED) notifyUnauthorized()
    if (status === HTTP_STATUS.FORBIDDEN) notifyForbidden()

    const message =
      status === 0
        ? msg('common.networkError')
        : status === HTTP_STATUS.UNAUTHORIZED
          ? msg('api.unauthorized')
          : status === HTTP_STATUS.FORBIDDEN
            ? msg('api.forbidden')
            : status === HTTP_STATUS.NOT_FOUND
              ? msg('api.notFound')
              : status >= HTTP_STATUS.SERVER_ERROR
                ? msg('api.serverError')
                : (payload?.message ?? payload?.error ?? msg('common.somethingWentWrong'))

    return Promise.reject(new ApiError(message, { status, data: payload, code: error.code }))
  },
)

/** Thin verb helpers so services never touch axios config shapes directly. */
export const http = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
}

export default http

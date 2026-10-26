import axios from 'axios'
import { mockRequest } from '../mock/adapter'
import { toApiError } from './errors'
import { clearSession, getToken } from './session'

/**
 * Chế độ demo chỉ bật khi VITE_USE_MOCK=true.
 * Mặc định gọi API thật; bật mock để xem giao diện khi chưa chạy backend.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// 401 from these endpoints means "wrong credentials", not "session expired":
// they must surface to the form instead of forcing a redirect.
const CREDENTIAL_PATHS = ['/auth/login', '/auth/register']
const SESSION_CHECK_PATH = '/auth/me'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  // 204/empty bodies arrive as '' — normalise so callers can treat them as "no payload".
  (response) => (response.data === '' ? null : response.data),
  (error) => {
    const status = error?.response?.status
    const url = error?.config?.url ?? ''
    const isCredentialAttempt = CREDENTIAL_PATHS.some((path) => url.startsWith(path))
    const isSessionCheck = url.startsWith(SESSION_CHECK_PATH)

    if (status === 401 && !isCredentialAttempt && !isSessionCheck) {
      clearSession()
      const { pathname } = window.location
      const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login'
      if (pathname !== '/login' && pathname !== '/admin/login') {
        window.location.assign(loginPath)
      }
    }
    return Promise.reject(toApiError(error))
  },
)

async function httpRequest(method, path, { query, body } = {}) {
  return http.request({ method, url: path, params: query, data: body })
}

async function mockHttp(method, path, { query, body } = {}) {
  return mockRequest(method, path, { body: { ...(query ?? {}), ...(body ?? {}) } })
}

/** Một cổng duy nhất cho cả hai chế độ: cùng đường dẫn, cùng shape trả về. */
export const request = USE_MOCK ? mockHttp : httpRequest

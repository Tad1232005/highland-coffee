import axios from 'axios'
import { mockRequest } from '../mock/adapter'
import { toApiError } from './errors'
import { clearSession, getToken } from './session'

/** Bật chế độ demo khi VITE_USE_MOCK=true (mặc định khi chưa có backend). */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error?.response?.status === 401) {
      clearSession()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(toApiError(error))
  },
)

async function httpRequest(method, path, { query, body } = {}) {
  const response = await http.request({ method, url: path, params: query, data: body })
  return response
}

async function mockHttp(method, path, { query, body } = {}) {
  return mockRequest(method, path, { body: { ...(query ?? {}), ...(body ?? {}) } })
}

/** Một cổng duy nhất cho cả hai chế độ: cùng đường dẫn, cùng shape trả về. */
export const request = USE_MOCK ? mockHttp : httpRequest

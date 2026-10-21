import { request } from './client'

/** Lớp gọi API theo đúng contract của backend (/api). */

export const auth = {
  login: (payload) => request('POST', '/auth/login', { body: payload }),
  register: (payload) => request('POST', '/auth/register', { body: payload }),
  me: () => request('GET', '/auth/me'),
  updateProfile: (payload) => request('PUT', '/auth/me', { body: payload }),
}

export const categories = {
  list: () => request('GET', '/categories'),
  get: (id) => request('GET', `/categories/${id}`),
  create: (payload) => request('POST', '/categories', { body: payload }),
  update: (id, payload) => request('PUT', `/categories/${id}`, { body: payload }),
  remove: (id) => request('DELETE', `/categories/${id}`),
}

export const products = {
  list: (params) => request('GET', '/products', { query: params }),
  get: (id) => request('GET', `/products/${id}`),
  create: (payload) => request('POST', '/products', { body: payload }),
  update: (id, payload) => request('PUT', `/products/${id}`, { body: payload }),
  remove: (id) => request('DELETE', `/products/${id}`),
}

export const cart = {
  get: () => request('GET', '/cart/items'),
  add: (payload) => request('POST', '/cart/items', { body: payload }),
  update: (id, quantity) => request('PATCH', `/cart/items/${id}`, { body: { quantity } }),
  remove: (id) => request('DELETE', `/cart/items/${id}`),
  clear: () => request('DELETE', '/cart/items'),
}

export const orders = {
  create: (payload) => request('POST', '/orders', { body: payload }),
  list: (params) => request('GET', '/orders', { query: params }),
  get: (id) => request('GET', `/orders/${id}`),
}

export const admin = {
  listOrders: (params) => request('GET', '/admin/orders', { query: params }),
  updateOrderStatus: (id, status) =>
    request('PATCH', `/admin/orders/${id}/status`, { body: { status } }),
}

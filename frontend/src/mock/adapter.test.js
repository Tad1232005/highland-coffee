import { describe, it, expect, beforeEach } from 'vitest'
import { mockRequest } from './adapter'
import { clearSession, saveSession } from '../api/session'

const CUSTOMER = { email: 'customer@highland.vn', password: 'Customer@123456' }
const ADMIN = { email: 'admin@highland.vn', password: 'Admin@123456' }

const loginAs = async (credentials) => {
  const auth = await mockRequest('POST', '/auth/login', { body: credentials })
  saveSession(auth.access_token, auth.user)
  return auth
}

describe('mock adapter', () => {
  beforeEach(() => {
    clearSession()
  })

  it('returns the backend auth shape on login', async () => {
    const result = await mockRequest('POST', '/auth/login', { body: CUSTOMER })
    expect(result.token_type).toBe('bearer')
    expect(result.access_token).toBeTruthy()
    expect(result.user.email).toBe(CUSTOMER.email)
    expect(result.user.password).toBeUndefined()
  })

  it('rejects wrong credentials with 401', async () => {
    await expect(
      mockRequest('POST', '/auth/login', {
        body: { email: CUSTOMER.email, password: 'sai-mat-khau' },
      }),
    ).rejects.toMatchObject({ status: 401 })
  })

  it('lists products with the pagination envelope', async () => {
    const result = await mockRequest('GET', '/products', { body: { page: 1, size: 5 } })
    expect(result.items.length).toBeLessThanOrEqual(5)
    expect(result.page).toBe(1)
    expect(result.size).toBe(5)
    expect(result.total).toBeGreaterThan(0)
  })

  it('hides unavailable products unless available_only is false', async () => {
    const all = await mockRequest('GET', '/products', {
      body: { page: 1, size: 100, available_only: false },
    })
    const onlyAvailable = await mockRequest('GET', '/products', { body: { page: 1, size: 100 } })
    expect(all.items.length).toBeGreaterThanOrEqual(onlyAvailable.items.length)
    expect(onlyAvailable.items.every((item) => item.is_available)).toBe(true)
  })

  it('keeps the cart, then creates a pending order and empties the cart', async () => {
    await loginAs(CUSTOMER)
    const products = await mockRequest('GET', '/products', { body: { page: 1, size: 1 } })
    const product = products.items[0]

    const cart = await mockRequest('POST', '/cart/items', {
      body: { product_id: product.id, quantity: 2 },
    })
    expect(cart.total_quantity).toBe(2)
    expect(cart.items[0].product.id).toBe(product.id)

    const order = await mockRequest('POST', '/orders', {
      body: { receiver_name: 'Nguyen Van A', phone: '0900000000', address: '123 Le Loi' },
    })
    expect(order.status).toBe('pending')
    expect(order.items[0].product_name).toBe(product.name)

    const after = await mockRequest('GET', '/cart/items', { body: {} })
    expect(after.items).toHaveLength(0)
  })

  it('blocks admin endpoints for customers', async () => {
    await loginAs(CUSTOMER)
    await expect(mockRequest('GET', '/admin/orders', { body: {} })).rejects.toMatchObject({
      status: 403,
    })
  })

  it('lets admins list and update orders', async () => {
    await loginAs(ADMIN)
    const list = await mockRequest('GET', '/admin/orders', { body: { page: 1, size: 10 } })
    expect(list.items.length).toBeGreaterThan(0)
    const order = list.items.find((item) => item.status === 'pending')
    if (!order) return
    const updated = await mockRequest('PATCH', `/admin/orders/${order.id}/status`, {
      body: { status: 'confirmed' },
    })
    expect(updated.status).toBe('confirmed')
  })
})

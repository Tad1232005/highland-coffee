import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../components/ToastProvider'
import { CartProvider } from '../context/CartProvider'
import { CartContext } from '../context/cartContext'
import { useCart } from '../context/useCart'
import { categories, products, cart, orders } from '../api'
import { Menu } from './Menu'
import { Checkout } from './Checkout'
import { MyOrders } from './MyOrders'
import { ProductDetail } from './ProductDetail'
import { Routes, Route } from 'react-router-dom'
import { useAsyncData } from '../hooks/useAsyncData'
import { toApiError } from '../api/errors'

const account = vi.hoisted(() => ({ id: 2, full_name: 'Khách hàng', phone: '0900000000' }))
vi.mock('../context/useAuth', () => ({ useAuth: () => ({ user: account }) }))
vi.mock('../api', () => ({
  categories: { list: vi.fn() }, products: { list: vi.fn(), get: vi.fn() },
  cart: { get: vi.fn(), add: vi.fn(), update: vi.fn(), remove: vi.fn(), clear: vi.fn() },
  orders: { list: vi.fn(), create: vi.fn() }, auth: {}, admin: {},
}))

const product = { id: 1, name: 'Phin Sữa Đá', price: 39000, category_id: 1, is_available: true, image_url: '', description: 'Cà phê đậm đà' }
const cartData = { items: [{ id: 1, product_id: 1, product, quantity: 1 }], total_quantity: 1, total_amount: 39000 }
const order = { id: 123, receiver_name: 'Khách hàng', phone: '0900000000', address: '123 Lê Lợi', status: 'pending', created_at: '2026-10-23T00:00:00Z', total_amount: 39000, items: [{ id: 1, product_name: 'Phin Sữa Đá', quantity: 1, subtotal: 39000 }] }
const list = (items = [product]) => ({ items, total: items.length, page: 1, size: 12, total_pages: 1 })
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const quietCart = { items: [], add: vi.fn(), mutating: false }
function Page({ children, initial = '/' }) {
  return <MemoryRouter initialEntries={[initial]}><ToastProvider><CartContext.Provider value={quietCart}>{children}</CartContext.Provider></ToastProvider></MemoryRouter>
}
function CartWrapper({ children }) { return <ToastProvider><CartProvider>{children}</CartProvider></ToastProvider> }
function CheckoutWrapper({ children }) { return <MemoryRouter><CartWrapper>{children}</CartWrapper></MemoryRouter> }

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  cart.get.mockResolvedValue(cartData)
  cart.clear.mockRejectedValue(new Error('Không được gọi clear sau tạo đơn'))
  categories.list.mockResolvedValue([{ id: 1, name: 'Cà phê' }])
  products.list.mockResolvedValue(list())
  products.get.mockResolvedValue(product)
  orders.create.mockResolvedValue(order)
  orders.list.mockResolvedValue({ items: [order], total: 1, total_pages: 1 })
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('Menu', () => {
  it('cancels pending debounce when clearing all filters', async () => {
    render(<Page><Menu /></Page>)
    await screen.findByRole('heading', { name: product.name })
    vi.useFakeTimers()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'không tồn tại' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xoá tất cả lọc' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(350) })
    expect(screen.getByRole('searchbox').value).toBe('')
    expect(products.list.mock.calls.some(([query]) => query.q === 'không tồn tại')).toBe(false)
  })
  it('resets page and combines the category and price query', async () => {
    products.list.mockResolvedValue({ ...list(), total: 18, total_pages: 2 })
    render(<Page><Menu /></Page>)
    await screen.findByRole('button', { name: 'Trang sau' })
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    await waitFor(() => expect(products.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))
    fireEvent.click(screen.getByRole('button', { name: 'Cà phê', exact: true }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '35-50' } })
    await waitFor(() => expect(products.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, category_id: 1, min_price: 35000, max_price: 50000 })))
  })
  it('separates load errors from empty results and can retry', async () => {
    products.list.mockRejectedValueOnce({ status: 500, detail: 'Mạng lỗi' })
    render(<Page><Menu /></Page>)
    await screen.findByRole('alert')
    expect(screen.queryByText('Không có món nào khớp')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại', exact: true }))
    expect(await screen.findByRole('heading', { name: product.name })).toBeTruthy()
  })
})

describe('Cart state', () => {
  it('does not let an older read overwrite a confirmed mutation', async () => {
    const pending = deferred()
    const loader = vi.fn(() => pending.promise)
    const { result } = renderHook(() => useAsyncData(loader, 'cart'))
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1))
    act(() => result.current.update({ total_amount: 78000 }))
    await act(async () => pending.resolve({ total_amount: 39000 }))
    expect(result.current.data.total_amount).toBe(78000)
  })
  it('exposes initial loading and a retriable error instead of an empty cart', async () => {
    cart.get.mockRejectedValueOnce({ detail: 'Không tải được giỏ' })
    const { result } = renderHook(() => useCart(), { wrapper: CartWrapper })
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.error).toBe('Không tải được giỏ'))
    act(() => result.current.reload())
    await waitFor(() => expect(result.current.totalAmount).toBe(39000))
  })
  it('blocks overlapping mutations and preserves confirmed data after failure', async () => {
    const pending = deferred()
    cart.update.mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useCart(), { wrapper: CartWrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    let first
    act(() => { first = result.current.setQuantity(1, 2).catch((error) => error) })
    await act(async () => {
      await expect(result.current.remove(1)).rejects.toThrow('đang được cập nhật')
    })
    expect(cart.remove).not.toHaveBeenCalled()
    await act(async () => { pending.reject({ detail: 'Cập nhật lỗi' }); await first })
    expect(result.current.totalQuantity).toBe(1)
    expect(result.current.totalAmount).toBe(39000)
    expect(result.current.mutating).toBe(false)
    cart.update.mockResolvedValueOnce({ ...cartData, total_quantity: 2, total_amount: 78000 })
    await act(async () => { await result.current.setQuantity(1, 2) })
    expect(result.current.totalAmount).toBe(78000)
  })
  it('uses the same lock for placing an order and cart edits', async () => {
    const pending = deferred()
    orders.create.mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useCart(), { wrapper: CartWrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    let placed
    act(() => { placed = result.current.placeOrder({ address: '123 Lê Lợi' }) })
    await act(async () => { await expect(result.current.add(product)).rejects.toThrow('đang được cập nhật') })
    expect(cart.add).not.toHaveBeenCalled()
    await act(async () => { pending.resolve(order); await placed })
    expect(result.current.items).toHaveLength(0)
    expect(result.current.totalAmount).toBe(0)
  })
})

describe('Checkout', () => {
  it('keeps server field paths when normalizing validation errors', () => {
    const error = toApiError({ response: { status: 422, data: { detail: [{ loc: ['body', 'phone'], msg: 'Số điện thoại sai' }] } } })
    expect(error.fieldErrors).toEqual({ phone: 'Số điện thoại sai' })
  })
  it('validates fields locally and focuses the first invalid field', async () => {
    render(<Checkout />, { wrapper: CheckoutWrapper })
    const submit = await screen.findByRole('button', { name: /Đặt món ·/ })
    fireEvent.change(screen.getByLabelText('Người nhận'), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: 'abc' } })
    fireEvent.click(submit)
    expect(screen.getByText('Vui lòng nhập tên người nhận.')).toBeTruthy()
    expect(screen.getByText('Số điện thoại chưa hợp lệ.')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByLabelText('Người nhận'))
    expect(orders.create).not.toHaveBeenCalled()
  })
  it('confirms once and empties local cart even when a follow-up cart request would fail', async () => {
    const pending = deferred()
    orders.create.mockReturnValueOnce(pending.promise)
    cart.get.mockResolvedValueOnce(cartData).mockRejectedValue(new Error('Đồng bộ lỗi'))
    render(<Checkout />, { wrapper: CheckoutWrapper })
    await screen.findByRole('button', { name: /Đặt món ·/ })
    fireEvent.change(screen.getByLabelText('Địa chỉ giao hàng'), { target: { value: '  123 Lê Lợi  ' } })
    fireEvent.click(screen.getByRole('button', { name: /Đặt món ·/ }))
    fireEvent.submit(screen.getByLabelText('Người nhận').form)
    expect(orders.create).toHaveBeenCalledTimes(1)
    expect(orders.create).toHaveBeenCalledWith(expect.objectContaining({ address: '123 Lê Lợi' }))
    await act(async () => pending.resolve(order))
    expect(await screen.findByRole('heading', { name: 'Đặt món thành công' })).toBeTruthy()
    expect(cart.get).toHaveBeenCalledTimes(1)
    expect(cart.clear).not.toHaveBeenCalled()
  })
  it('preserves values and maps server field validation after a failed request', async () => {
    orders.create.mockRejectedValueOnce({ detail: 'Địa chỉ không hợp lệ', fieldErrors: { address: 'Kiểm tra địa chỉ' } })
    render(<Checkout />, { wrapper: CheckoutWrapper })
    await screen.findByRole('button', { name: /Đặt món ·/ })
    fireEvent.change(screen.getByLabelText('Địa chỉ giao hàng'), { target: { value: '123 Lê Lợi' } })
    fireEvent.click(screen.getByRole('button', { name: /Đặt món ·/ }))
    expect(await screen.findByText('Kiểm tra địa chỉ')).toBeTruthy()
    expect(screen.getByLabelText('Địa chỉ giao hàng').value).toBe('123 Lê Lợi')
    expect(document.activeElement).toBe(screen.getByLabelText('Địa chỉ giao hàng'))
  })
})

describe('My orders', () => {
  it('requests later pages and refreshes the current page', async () => {
    orders.list.mockImplementation(({ page }) => Promise.resolve({ items: [{ ...order, id: page === 1 ? 123 : 99 }], total: 21, total_pages: 3 }))
    render(<Page><MyOrders /></Page>)
    await screen.findByRole('heading', { name: 'Đơn #123' })
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    expect(await screen.findByRole('heading', { name: 'Đơn #99' })).toBeTruthy()
    expect(orders.list).toHaveBeenLastCalledWith({ page: 2, size: 10 })
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại danh sách' }))
    await waitFor(() => expect(orders.list).toHaveBeenCalledTimes(3))
    expect(orders.list).toHaveBeenLastCalledWith({ page: 2, size: 10 })
  })
  it('renders an error without an empty-history message', async () => {
    orders.list.mockRejectedValueOnce({ detail: 'Lỗi tải đơn' })
    render(<Page><MyOrders /></Page>)
    await screen.findByRole('alert')
    expect(screen.queryByText('Chưa có đơn nào')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại đơn hàng' }))
    expect(await screen.findByRole('heading', { name: 'Đơn #123' })).toBeTruthy()
  })
  it('marks the current step and treats cancelled orders separately', async () => {
    orders.list.mockResolvedValueOnce({ items: [order, { ...order, id: 124, status: 'cancelled' }], total: 2, total_pages: 1 })
    render(<Page><MyOrders /></Page>)
    await screen.findByRole('heading', { name: 'Đơn #123' })
    expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1)
    expect(screen.getByText('Đơn đã huỷ. Quá trình xử lý đơn đã kết thúc.')).toBeTruthy()
  })
})

describe('Product detail', () => {
  const detail = () => render(<Page initial="/products/1"><Routes><Route path="/products/:id" element={<ProductDetail />} /></Routes></Page>)
  it('keeps the main product available when related products fail', async () => {
    products.list.mockRejectedValueOnce({ detail: 'Không tải được gợi ý' })
    detail()
    expect(await screen.findByRole('heading', { name: product.name })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Thêm vào giỏ ·/ }).disabled).toBe(false)
  })
  it('disables buying an unavailable product and shows image fallback', async () => {
    products.get.mockResolvedValueOnce({ ...product, is_available: false })
    detail()
    await screen.findByRole('heading', { name: product.name })
    expect(screen.getAllByRole('button', { name: 'Tạm ngừng bán' }).every((button) => button.disabled)).toBe(true)
  })
  it('shows a fallback after an image error', async () => {
    products.get.mockResolvedValueOnce({ ...product, image_url: '/missing-image.jpg' })
    detail()
    const image = await screen.findByRole('img', { name: product.name })
    fireEvent.error(image)
    expect(screen.queryByRole('img', { name: product.name })).toBeNull()
    expect(screen.getByRole('heading', { name: product.name })).toBeTruthy()
  })
  it('distinguishes a 404 from a recoverable server error', async () => {
    products.get.mockRejectedValueOnce({ status: 500, detail: 'Máy chủ lỗi' })
    detail()
    await screen.findByRole('alert')
    expect(screen.queryByText('Món này không còn trên thực đơn')).toBeNull()
    products.get.mockRejectedValueOnce({ status: 404, detail: 'Món không tồn tại' })
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại', exact: true }))
    expect(await screen.findByText('Món này không còn trên thực đơn')).toBeTruthy()
  })
})

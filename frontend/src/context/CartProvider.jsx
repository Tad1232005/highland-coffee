import { useCallback, useMemo, useRef, useState } from 'react'
import { cart as cartApi, orders } from '../api'
import { useAsyncData } from '../hooks/useAsyncData'
import { useAuth } from './useAuth'
import { useToast } from './useToast'
import { CartContext } from './cartContext'

const EMPTY_CART = { items: [], total_quantity: 0, total_amount: 0 }

// Fresh state and lock for each account, including pending responses at logout.
export function CartProvider({ children }) {
  const { user } = useAuth()
  return <CartSession key={user?.id ?? 'anonymous'} user={user}>{children}</CartSession>
}

function CartSession({ user, children }) {
  const { notify } = useToast()
  const [revision, setRevision] = useState(0)
  const [mutating, setMutating] = useState(false)
  const locked = useRef(false)
  const loader = useCallback(() => user ? cartApi.get() : Promise.resolve(EMPTY_CART), [user])
  const { data, error, loading, update } = useAsyncData(loader, `cart-${revision}`)
  const cart = data ?? EMPTY_CART

  const reload = useCallback(() => {
    if (!locked.current) setRevision((value) => value + 1)
  }, [])

  const runMutation = useCallback(async (action, { checkout = false } = {}) => {
    if (!user) {
      notify('Đăng nhập để thêm món vào giỏ hàng.', { type: 'info', title: 'Cần đăng nhập' })
      throw new Error('unauthorized')
    }
    const blocked = locked.current
      ? 'Giỏ hàng đang được cập nhật. Vui lòng đợi một chút.'
      : loading || error ? 'Vui lòng tải lại giỏ hàng trước khi tiếp tục.' : ''
    if (blocked) {
      const blockedError = new Error(blocked)
      if (!checkout) { notify(blocked, { type: 'info' }); blockedError.notified = true }
      throw blockedError
    }
    locked.current = true
    setMutating(true)
    try {
      const result = await action()
      update(checkout ? EMPTY_CART : result)
      return result
    } catch (requestError) {
      // Checkout presents request errors next to the form.
      if (!checkout) {
        notify(requestError.detail ?? requestError.message ?? 'Không cập nhật được giỏ hàng.', { type: 'error' })
        requestError.notified = true
      }
      throw requestError
    } finally {
      locked.current = false
      setMutating(false)
    }
  }, [user, notify, loading, error, update])

  const add = useCallback(async (product, quantity = 1) => {
    const next = await runMutation(() => cartApi.add({ product_id: product.id, quantity }))
    notify(`Đã thêm "${product.name}" vào giỏ hàng.`, { type: 'success' })
    return next
  }, [runMutation, notify])
  const setQuantity = useCallback((id, quantity) => runMutation(() => cartApi.update(id, quantity)), [runMutation])
  const remove = useCallback((id) => runMutation(() => cartApi.remove(id)), [runMutation])
  const clear = useCallback(() => runMutation(() => cartApi.clear()), [runMutation])
  const refresh = useCallback(() => runMutation(() => cartApi.get()), [runMutation])
  // The order transaction already clears the server cart. Success never depends
  // on a second DELETE/GET, and this lock also blocks concurrent cart edits.
  const placeOrder = useCallback((payload) => runMutation(() => orders.create(payload), { checkout: true }), [runMutation])

  const value = useMemo(() => ({
    items: cart.items, totalQuantity: cart.total_quantity, totalAmount: cart.total_amount,
    loading, error, mutating, reload, refresh, add, setQuantity, remove, clear, placeOrder,
  }), [cart, loading, error, mutating, reload, refresh, add, setQuantity, remove, clear, placeOrder])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

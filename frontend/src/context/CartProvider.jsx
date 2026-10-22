import { useCallback, useMemo } from 'react'
import { cart as cartApi } from '../api'
import { useAsyncData } from '../hooks/useAsyncData'
import { useAuth } from './useAuth'
import { useToast } from './useToast'
import { CartContext } from './cartContext'

const EMPTY_CART = { items: [], total_quantity: 0, total_amount: 0 }

export function CartProvider({ children }) {
  const { user } = useAuth()
  const { notify } = useToast()
  const key = user?.id ?? null

  const loader = useCallback(async () => {
    if (!user) return EMPTY_CART
    try {
      return await cartApi.get()
    } catch {
      return EMPTY_CART
    }
  }, [user])

  const { data, update } = useAsyncData(loader, key)
  const cart = data ?? EMPTY_CART

  const add = useCallback(
    async (product, quantity = 1) => {
      if (!user) {
        notify('Đăng nhập để thêm món vào giỏ hàng.', {
          type: 'info',
          title: 'Cần đăng nhập',
        })
        throw new Error('unauthorized')
      }
      const next = await cartApi.add({ product_id: product.id, quantity })
      update(next)
      notify(`Đã thêm "${product.name}" vào giỏ hàng.`, { type: 'success' })
      return next
    },
    [notify, update, user],
  )

  const setQuantity = useCallback(
    async (itemId, quantity) => {
      const next = await cartApi.update(itemId, quantity)
      update(next)
      return next
    },
    [update],
  )

  const remove = useCallback(
    async (itemId) => {
      const next = await cartApi.remove(itemId)
      update(next)
      return next
    },
    [update],
  )

  const clear = useCallback(async () => {
    const next = await cartApi.clear()
    update(next)
    return next
  }, [update])

  const refresh = useCallback(async () => {
    const next = await loader()
    update(next)
    return next
  }, [loader, update])

  const value = useMemo(
    () => ({
      items: cart.items,
      totalQuantity: cart.total_quantity,
      totalAmount: cart.total_amount,
      loading: false,
      refresh,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [cart, refresh, add, setQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

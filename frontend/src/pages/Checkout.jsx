import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { orders as ordersApi } from '../api'
import { EmptyState } from '../components'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { useToast } from '../context/useToast'
import { formatPrice } from '../utils/format'

export function Checkout() {
  const { user } = useAuth()
  const { items, totalAmount, clear } = useCart()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [form, setForm] = useState(() => ({
    receiver_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    address: '',
    note: '',
  }))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <EmptyState
            title="Chưa có món để thanh toán"
            text="Chọn món trước khi điền thông tin giao hàng."
            action={
              <Link to="/menu" className="btn btn--primary">
                Xem thực đơn
              </Link>
            }
          />
        </div>
      </section>
    )
  }

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const order = await ordersApi.create(form)
      await clear()
      notify('Đơn hàng đã được gửi tới quán.', {
        type: 'success',
        title: `Đặt món #${order.id} thành công`,
      })
      navigate('/my-orders', { state: { placedOrderId: order.id }, replace: true })
    } catch (requestError) {
      const message = requestError.detail ?? 'Không tạo được đơn hàng. Thử lại sau.'
      setError(message)
      notify(message, { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h1 className="section-head__title">Thanh toán</h1>
          <p className="menu-result">{items.length} món trong giỏ</p>
        </div>

        <div className="cart">
          <form className="checkout" onSubmit={handleSubmit}>
            {error && <p className="notice notice--error">{error}</p>}

            <div className="field">
              <label className="field__label" htmlFor="receiver_name">
                Người nhận
              </label>
              <input
                id="receiver_name"
                className="field__control"
                value={form.receiver_name}
                onChange={update('receiver_name')}
                required
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="phone">
                Số điện thoại
              </label>
              <input
                id="phone"
                className="field__control"
                type="tel"
                inputMode="tel"
                placeholder="09xx xxx xxx"
                value={form.phone}
                onChange={update('phone')}
                required
              />
              <p className="field__hint">Quán gọi để xác nhận trước khi chuyển món.</p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="address">
                Địa chỉ giao hàng
              </label>
              <textarea
                id="address"
                className="field__control"
                rows="3"
                placeholder="Số nhà, đường, phường/xã, quận/huyện"
                value={form.address}
                onChange={update('address')}
                required
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="note">
                Ghi chú cho quán
              </label>
              <textarea
                id="note"
                className="field__control"
                rows="2"
                placeholder="Ít đá, thêm sữa, giao sau 15h…"
                value={form.note}
                onChange={update('note')}
              />
            </div>

            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Đang gửi đơn' : 'Đặt món'}
            </button>
          </form>

          <aside className="summary">
            <h2 className="summary__title">Đơn hàng</h2>
            <ul className="summary__items">
              {items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.product.name} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.product.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="summary__total">
              <span>Tổng cộng</span>
              <span className="price price--lg">{formatPrice(totalAmount)}</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

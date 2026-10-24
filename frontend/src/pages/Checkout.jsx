import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { EmptyState, Loading } from '../components'
import { IconCheckCircle } from '../components/icons'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { formatPrice } from '../utils/format'
import { normalizeCheckout, validateCheckout } from '../utils/validation'

export function Checkout() {
  const { user } = useAuth()
  const { items, totalAmount, totalQuantity, loading, error: cartError, mutating, reload, placeOrder } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => ({ receiver_name: user?.full_name ?? '', phone: user?.phone ?? '', address: '', note: '' }))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [placed, setPlaced] = useState(null)
  const formRef = useRef(null)
  const successRef = useRef(null)
  const pending = useRef(false)

  useEffect(() => {
    if (submitting) return
    const name = ['receiver_name', 'phone', 'address', 'note'].find((field) => errors[field])
    if (name) formRef.current?.elements.namedItem(name)?.focus()
  }, [errors, submitting])

  useEffect(() => {
    if (!placed) return
    successRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [placed])
  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (pending.current || mutating || loading || cartError) return
    const nextErrors = validateCheckout(form)
    setErrors(nextErrors)
    setError('')
    if (Object.keys(nextErrors).length) return
    pending.current = true
    setSubmitting(true)
    try {
      const order = await placeOrder(normalizeCheckout(form))
      setPlaced(order)
    } catch (requestError) {
      const fields = requestError.fieldErrors ?? {}
      setErrors(fields)
      setError(requestError.detail ?? requestError.message ?? 'Không tạo được đơn hàng. Thử lại sau.')
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }

  if (!user) return <Navigate to="/login" replace />

  if (placed) return (
    <section className="section"><div className="container">
      <div className="panel checkout-success" role="status">
        <IconCheckCircle width={52} height={52} className="checkout-success__icon" />
        <p className="checkout-success__eyebrow">Cảm ơn bạn đã chọn quán</p>
        <h1 ref={successRef} tabIndex={-1} className="page-head__title">Đặt món thành công</h1>
        <p>Đơn <strong>#{placed.id}</strong> đang chờ quán xác nhận.</p>
        <dl className="summary__rows checkout-success__receipt">
          <div className="summary__row"><dt>Người nhận</dt><dd>{placed.receiver_name}</dd></div>
          <div className="summary__row"><dt>Điện thoại</dt><dd>{placed.phone}</dd></div>
          <div className="summary__row"><dt>Giao đến</dt><dd>{placed.address}</dd></div>
          <div className="summary__total"><dt>Tổng tiền</dt><dd className="price price--lg">{formatPrice(placed.total_amount)}</dd></div>
        </dl>
        <div className="checkout-success__actions">
          <button type="button" className="btn btn--primary" onClick={() => navigate('/my-orders', { state: { placedOrderId: placed.id }, replace: true })}>Xem đơn của tôi</button>
          <Link to="/menu" className="btn btn--outline">Tiếp tục chọn món</Link>
        </div>
      </div>
    </div></section>
  )

  if (loading) return <section className="section"><div className="container"><Loading label="Đang lấy giỏ hàng" /></div></section>
  if (cartError) return <section className="section"><div className="container"><h1 className="page-head__title">Thanh toán</h1>
    <div className="notice notice--error" role="alert"><p>{cartError}</p><button type="button" className="btn btn--outline" onClick={reload}>Thử lại giỏ hàng</button></div>
  </div></section>
  if (!items.length) return <section className="section"><div className="container"><EmptyState title="Chưa có món để thanh toán" text="Chọn món trước khi điền thông tin giao hàng." action={<Link to="/menu" className="btn btn--primary">Xem thực đơn</Link>} /></div></section>

  const fieldProps = (name) => ({
    id: name, name, value: form[name], onChange: update(name),
    'aria-required': true, 'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${name}-error` : name === 'phone' ? 'phone-hint' : undefined,
    className: 'field__control',
  })
  return (
    <section className="section"><div className="container">
      <div className="page-head">
        <div className="page-head__row"><h1 className="page-head__title">Thanh toán</h1><p className="menu-result">{totalQuantity} món trong giỏ</p></div>
        <p className="page-head__lead">Kiểm tra đơn và điền thông tin để quán giao đúng nơi bạn cần.</p>
      </div>
      <div className="cart">
        <form ref={formRef} className="checkout" noValidate onSubmit={handleSubmit} aria-busy={submitting}>
          {error && <p className="notice notice--error" role="alert">{error}</p>}
          <fieldset disabled={submitting} className="checkout__fields">
            <legend className="checkout__section-title">Thông tin người nhận</legend>
            <div className="checkout__row">
              <div className="field"><label className="field__label" htmlFor="receiver_name">Người nhận</label>
                <input {...fieldProps('receiver_name')} autoComplete="name" maxLength={200} />
                {errors.receiver_name && <p id="receiver_name-error" className="field__error">{errors.receiver_name}</p>}
              </div>
              <div className="field"><label className="field__label" htmlFor="phone">Số điện thoại</label>
                <input {...fieldProps('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={50} placeholder="09xx xxx xxx" />
                {errors.phone && <p id="phone-error" className="field__error">{errors.phone}</p>}
                <p id="phone-hint" className="field__hint">Quán gọi để xác nhận trước khi chuyển món.</p>
              </div>
            </div>
            <div className="field"><label className="field__label" htmlFor="address">Địa chỉ giao hàng</label>
              <textarea {...fieldProps('address')} autoComplete="street-address" rows={3} placeholder="Số nhà, đường, phường/xã, quận/huyện" />
              {errors.address && <p id="address-error" className="field__error">{errors.address}</p>}
            </div>
            <div className="field"><label className="field__label" htmlFor="note">Ghi chú cho quán</label>
              <textarea id="note" name="note" className="field__control" rows={2} value={form.note} onChange={update('note')} placeholder="Ít đá, thêm sữa…" aria-invalid={Boolean(errors.note)} aria-describedby={errors.note ? 'note-error' : undefined} />
              {errors.note && <p id="note-error" className="field__error">{errors.note}</p>}
            </div>
          </fieldset>
          <p role="status" className="field__hint">{submitting ? 'Đang gửi đơn tới quán…' : mutating ? 'Đợi giỏ hàng cập nhật trước khi đặt món.' : 'Thông tin của bạn chỉ dùng để xác nhận và giao đơn này.'}</p>
          <button type="submit" className="btn btn--primary btn--block" disabled={submitting || mutating}>{submitting ? 'Đang gửi đơn…' : `Đặt món · ${formatPrice(totalAmount)}`}</button>
        </form>
        <aside className="summary"><h2 className="summary__title">Đơn hàng của bạn</h2>
          <ul className="summary__items">{items.map((item) => <li key={item.id}><span>{item.product.name} × {item.quantity}</span><span>{formatPrice(item.product.price * item.quantity)}</span></li>)}</ul>
          <div className="summary__total"><span>Tổng cộng</span><span className="price price--lg">{formatPrice(totalAmount)}</span></div>
          <Link to="/cart" className="btn btn--quiet btn--block" aria-disabled={submitting} onClick={(event) => { if (submitting) event.preventDefault() }}>Chỉnh sửa giỏ hàng</Link>
        </aside>
      </div>
    </div></section>
  )
}

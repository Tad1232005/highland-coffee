import { Link, useNavigate } from 'react-router-dom'
import { EmptyState, Loading, QuantityStepper } from '../components'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { useConfirm } from '../context/useConfirm'
import { useToast } from '../context/useToast'
import { formatPrice } from '../utils/format'

export function Cart() {
  const { user } = useAuth()
  const { items, totalQuantity, totalAmount, setQuantity, remove, clear, loading, error, mutating, reload } = useCart()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { notify } = useToast()

  const handleRemove = async (item) => {
    const confirmed = await confirm({
      title: 'Bỏ món khỏi giỏ?',
      message: `"${item.product.name}" sẽ không còn trong giỏ hàng.`,
      confirmText: 'Bỏ món',
      cancelText: 'Giữ lại',
    })
    if (!confirmed) return
    try {
      await remove(item.id)
      notify(`Đã bỏ "${item.product.name}" khỏi giỏ.`, { type: 'info' })
    } catch { /* CartProvider displays the request error. */ }
  }

  const handleClear = async () => {
    const confirmed = await confirm({
      title: 'Xoá toàn bộ giỏ hàng?',
      message: 'Tất cả món đang chọn sẽ bị xoá khỏi giỏ hàng.',
      confirmText: 'Xoá giỏ',
      cancelText: 'Giữ lại',
      danger: true,
    })
    if (!confirmed) return
    try {
      await clear()
      notify('Giỏ hàng đã được xoá.', { type: 'info' })
    } catch { /* CartProvider displays the request error. */ }
  }

  if (!user) {
    return (
      <section className="section">
        <div className="container">
          <EmptyState
            title="Giỏ hàng gắn với tài khoản của bạn"
            text="Đăng nhập để xem và chỉnh món đã chọn trên mọi thiết bị."
            action={
              <Link to="/login" className="btn btn--primary">
                Đăng nhập
              </Link>
            }
          />
        </div>
      </section>
    )
  }

  if (loading && items.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <Loading label="Đang lấy giỏ hàng" />
        </div>
      </section>
    )
  }

  if (error) {
    return <section className="section"><div className="container">
      <h1 className="page-head__title">Giỏ hàng</h1>
      <div className="notice notice--error" role="alert"><p>{error}</p>
        <button type="button" className="btn btn--outline" onClick={reload}>Thử lại giỏ hàng</button>
      </div>
    </div></section>
  }

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <EmptyState
            title="Giỏ hàng đang trống"
            text="Chọn một ly cà phê phin hoặc một ly trà sen để bắt đầu."
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

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <div className="page-head__row">
            <h1 className="page-head__title">Giỏ hàng</h1>
            <p className="menu-result">{totalQuantity} món</p>
          </div>
          <p className="page-head__lead">
            Kiểm tra số lượng từng món, tổng tiền sẽ cập nhật ngay bên dưới.
          </p>
        </div>

        <p role="status" className="cart__status">{mutating ? 'Đang cập nhật giỏ hàng…' : 'Giỏ hàng đã cập nhật'}</p>
        <div className="cart" aria-busy={mutating}>
          <ul className="cart__items">
            {items.map((item) => (
              <li key={item.id} className="cart__item">
                <Link to={`/products/${item.product_id}`} className="cart__thumb">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    width="120"
                    height="120"
                    loading="lazy"
                  />
                </Link>

                <div className="cart__info">
                  <h2 className="cart__name">
                    <Link to={`/products/${item.product_id}`}>{item.product.name}</Link>
                  </h2>
                  <p className="cart__unit">Đơn giá {formatPrice(item.product.price)}</p>
                </div>

                <div className="cart__qty">
                  <QuantityStepper
                    value={item.quantity}
                    min={1}
                    onChange={(value) => { setQuantity(item.id, value).catch(() => {}) }}
                    disabled={mutating}
                    label={`Số lượng ${item.product.name}`}
                  />
                </div>

                <p className="price cart__subtotal">{formatPrice(item.product.price * item.quantity)}</p>

                <button
                  type="button"
                  className="cart__remove"
                  disabled={mutating}
                  onClick={() => handleRemove(item)}
                  aria-label={`Xoá ${item.product.name} khỏi giỏ`}
                >
                  Xoá
                </button>
              </li>
            ))}
          </ul>

          <aside className="summary">
            <h2 className="summary__title">Tóm tắt đơn</h2>
            <dl className="summary__rows">
              <div className="summary__row">
                <dt>Số lượng</dt>
                <dd>{totalQuantity} món</dd>
              </div>
              <div className="summary__row">
                <dt>Phí giao hàng</dt>
                <dd>Miễn phí trong nội thành</dd>
              </div>
            </dl>
            <div className="summary__total">
              <span>Tổng cộng</span>
              <span className="price price--lg">{formatPrice(totalAmount)}</span>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => navigate('/checkout')}
              disabled={mutating || loading}
            >
              Thanh toán
            </button>
            <button type="button" className="btn btn--quiet btn--block" onClick={handleClear} disabled={mutating}>
              Xoá giỏ hàng
            </button>
          </aside>
        </div>
      </div>
    </section>
  )
}

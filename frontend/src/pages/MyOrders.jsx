import { useCallback } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { orders as ordersApi } from '../api'
import { EmptyState, Loading, StatusBadge } from '../components'
import { orderFlow } from '../content/orders'
import { useAuth } from '../context/useAuth'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatDateTime, formatPrice } from '../utils/format'

function OrderTimeline({ status }) {
  if (status === 'cancelled') {
    return <p className="timeline timeline--cancelled">Đơn đã huỷ và không được pha chế.</p>
  }
  const currentIndex = orderFlow.indexOf(status)
  return (
    <ol className="timeline">
      {orderFlow.map((step, index) => (
        <li
          key={step}
          className={`timeline__step${index <= currentIndex ? ' is-done' : ''}`}
        >
          <span className="timeline__dot" aria-hidden="true" />
          <span className="timeline__label">
            {step === 'pending'
              ? 'Chờ xác nhận'
              : step === 'confirmed'
                ? 'Đã xác nhận'
                : step === 'preparing'
                  ? 'Đang pha'
                  : 'Hoàn tất'}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function MyOrders() {
  const { user } = useAuth()
  const location = useLocation()
  const placedOrderId = location.state?.placedOrderId

  const loader = useCallback(() => ordersApi.list({ page: 1, size: 20 }), [])
  const { data, error, loading } = useAsyncData(loader, `orders-${placedOrderId ?? 'list'}`)
  const result = data ?? { items: [], total: 0 }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <div className="page-head__row">
            <h1 className="page-head__title">Đơn của tôi</h1>
            <p className="menu-result">{result.total} đơn</p>
          </div>
          <p className="page-head__lead">
            Theo dõi trạng thái từng ly cà phê từ lúc quán nhận đơn đến khi chuyển món.
          </p>
        </div>

        {placedOrderId && (
          <p className="notice notice--success">
            Đơn #{placedOrderId} đã gửi tới quán. Quán sẽ xác nhận trong ít phút.
          </p>
        )}
        {error && <p className="notice notice--error">{error}</p>}
        {loading && <Loading label="Đang tải đơn hàng" />}

        {!loading && result.items.length === 0 && (
          <EmptyState
            title="Chưa có đơn nào"
            text="Khi bạn đặt món, đơn hàng sẽ hiện kèm trạng thái pha chế tại đây."
            action={
              <Link to="/menu" className="btn btn--primary">
                Xem thực đơn
              </Link>
            }
          />
        )}

        <div className="orders">
          {result.items.map((order) => (
            <article key={order.id} className="order">
              <header className="order__head">
                <div>
                  <h2 className="order__id">Đơn #{order.id}</h2>
                  <p className="order__time">{formatDateTime(order.created_at)}</p>
                </div>
                <StatusBadge status={order.status} />
              </header>

              <OrderTimeline status={order.status} />

              <ul className="order__items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.subtotal)}</span>
                  </li>
                ))}
              </ul>

              <footer className="order__foot">
                <div className="order__meta">
                  <p>
                    <strong>{order.receiver_name}</strong> · {order.phone}
                  </p>
                  <p>{order.address}</p>
                  {order.note && <p className="order__note">Ghi chú: {order.note}</p>}
                </div>
                <p className="price price--lg">{formatPrice(order.total_amount)}</p>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

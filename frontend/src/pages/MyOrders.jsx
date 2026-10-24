import { useCallback, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { orders as ordersApi } from '../api'
import { EmptyState, Loading, StatusBadge } from '../components'
import { orderFlow, orderStatusLabels } from '../content/orders'
import { useAuth } from '../context/useAuth'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatDateTime, formatPrice } from '../utils/format'

function OrderTimeline({ status }) {
  if (status === 'cancelled') return <p className="timeline timeline--cancelled">Đơn đã huỷ. Quá trình xử lý đơn đã kết thúc.</p>
  const currentIndex = orderFlow.indexOf(status)
  return <ol className="timeline" aria-label="Tiến trình đơn hàng">{orderFlow.map((step, index) => (
    <li key={step} className={`timeline__step${index < currentIndex ? ' is-done' : ''}${index === currentIndex ? ' is-current' : ''}`} aria-current={index === currentIndex ? 'step' : undefined}>
      <span className="timeline__dot" aria-hidden="true" />
      <span className="timeline__label">{orderStatusLabels[step]}</span>
      <span className="timeline__state">{index < currentIndex ? 'Đã qua' : index === currentIndex ? 'Hiện tại' : 'Chưa tới'}</span>
    </li>
  ))}</ol>
}

export function MyOrders() {
  const { user } = useAuth()
  const { state } = useLocation()
  const placedOrderId = state?.placedOrderId
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const loader = useCallback(() => ordersApi.list({ page, size: 10 }), [page])
  const { data, error, loading } = useAsyncData(loader, `orders-${user?.id}-${page}-${revision}-${placedOrderId ?? ''}`)
  const result = data ?? { items: [], total: 0, total_pages: 0 }
  if (!user) return <Navigate to="/login" replace />

  return <section className="section"><div className="container">
    <div className="page-head">
      <div className="page-head__row"><h1 className="page-head__title">Đơn của tôi</h1><p className="menu-result">{loading ? 'Đang tải…' : error ? 'Chưa tải được đơn' : `${result.total} đơn`}</p></div>
      <p className="page-head__lead">Từ lúc quán nhận đơn đến khi hoàn tất, mọi thông tin đều ở đây.</p>
    </div>
    <div className="orders-toolbar"><Link to="/menu" className="btn btn--outline btn--sm">Chọn thêm món</Link>
      <button type="button" className="btn btn--outline btn--sm" disabled={loading} onClick={() => setRevision((value) => value + 1)}>Tải lại danh sách</button>
    </div>
    {placedOrderId && <p className="notice notice--success" role="status">Đơn #{placedOrderId} đã gửi tới quán. Quán sẽ xác nhận trong ít phút.</p>}
    {error && <div className="notice notice--error" role="alert"><p>{error}</p><button type="button" className="btn btn--outline" onClick={() => setRevision((value) => value + 1)}>Thử lại đơn hàng</button></div>}
    {loading && <Loading label="Đang tải đơn hàng" />}
    {!loading && !error && !result.items.length && <EmptyState title={page === 1 ? 'Chưa có đơn nào' : 'Trang này chưa có đơn'} text="Đơn hàng và trạng thái xử lý sẽ xuất hiện tại đây." action={page === 1 ? <Link to="/menu" className="btn btn--primary">Xem thực đơn</Link> : <button type="button" className="btn btn--outline" onClick={() => setPage(1)}>Về trang đầu</button>} />}
    {!loading && !error && <div className="orders">{result.items.map((order) => (
      <article key={order.id} className="order">
        <header className="order__head"><div><h2 className="order__id">Đơn #{order.id}</h2><p className="order__time">{formatDateTime(order.created_at)}</p></div><StatusBadge status={order.status} /></header>
        <OrderTimeline status={order.status} />
        <p className="order__preview">{order.items.slice(0, 2).map((item) => `${item.product_name} × ${item.quantity}`).join(' · ')}{order.items.length > 2 ? ` · và ${order.items.length - 2} món khác` : ''}</p>
        <div className="order__total"><span>Tổng tiền</span><strong className="price">{formatPrice(order.total_amount)}</strong></div>
        <details className="order__details"><summary>Xem chi tiết đơn #{order.id}</summary>
          <ul className="order__items">{order.items.map((item) => <li key={item.id}><span>{item.product_name} × {item.quantity}</span><span>{formatPrice(item.subtotal)}</span></li>)}</ul>
          <div className="order__meta"><p><strong>{order.receiver_name}</strong> · {order.phone}</p><p>{order.address}</p>{order.note && <p className="order__note">Ghi chú: {order.note}</p>}</div>
        </details>
      </article>
    ))}</div>}
    {!loading && !error && result.total_pages > 1 && <nav className="pagination" aria-label="Phân trang đơn hàng">
      <button type="button" className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trang trước</button>
      <span className="pagination__status" role="status">Trang {page} / {result.total_pages}</span>
      <button type="button" className="btn btn--outline btn--sm" disabled={page >= result.total_pages} onClick={() => setPage((value) => value + 1)}>Trang sau</button>
    </nav>}
  </div></section>
}

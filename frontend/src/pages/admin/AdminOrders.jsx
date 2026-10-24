import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { admin as adminApi } from '../../api'
import { EmptyState, Loading, StatusBadge } from '../../components'
import { Modal } from '../../components/Modal'
import { orderStatusLabels, orderTransitions } from '../../content/orders'
import { useConfirm } from '../../context/useConfirm'
import { useToast } from '../../context/useToast'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatDateTime, formatPrice } from '../../utils/format'

const ACTION_LABELS = {
  confirmed: 'Xác nhận',
  preparing: 'Bắt đầu pha',
  completed: 'Hoàn tất',
  cancelled: 'Huỷ đơn',
}

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'preparing', label: 'Đang pha' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã huỷ' },
]

export function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const requestedStatus = searchParams.get('status') ?? ''
  const status = FILTERS.some((filter) => filter.value === requestedStatus) ? requestedStatus : ''
  const [busyId, setBusyId] = useState(null)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [actionError, setActionError] = useState('')
  const confirm = useConfirm()
  const { notify } = useToast()

  const loader = useCallback(
    () => adminApi.listOrders({ page, size: 10, status: status || undefined }),
    [page, status],
  )
  const { data, error: loadError, loading, update } = useAsyncData(
    loader,
    `admin-orders-${page}-${status}`,
  )
  const result = data ?? { items: [], total: 0, total_pages: 0 }
  const error = actionError || loadError
  const selectedOrder = result.items.find((order) => order.id === selectedOrderId) ?? null

  const changeStatus = async (order, nextStatus) => {
    if (nextStatus === 'cancelled') {
      const confirmed = await confirm({
        title: `Huỷ đơn #${order.id}?`,
        message: `Khách hàng ${order.receiver_name} sẽ không còn thấy đơn này được chuẩn bị.`,
        confirmText: 'Huỷ đơn',
        cancelText: 'Giữ đơn',
        danger: true,
      })
      if (!confirmed) return
    }

    setBusyId(order.id)
    setActionError('')
    try {
      await adminApi.updateOrderStatus(order.id, nextStatus)
      update((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === order.id ? { ...item, status: nextStatus } : item,
        ),
      }))
      notify(`Đơn #${order.id}: ${orderStatusLabels[nextStatus]}.`, { type: 'success' })
    } catch (requestError) {
      const message = requestError.detail ?? 'Không cập nhật được trạng thái đơn.'
      setActionError(message)
      notify(message, { type: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  const renderActions = (order, showDetails = true) => (
    <div className="row-actions">
      {showDetails && (
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={() => setSelectedOrderId(order.id)}
        >
          Chi tiết
        </button>
      )}
      {orderTransitions[order.status]?.map((nextStatus) => (
        <button
          key={nextStatus}
          type="button"
          className={`btn btn--sm ${nextStatus === 'cancelled' ? 'btn--danger' : 'btn--primary'}`}
          onClick={() => changeStatus(order, nextStatus)}
          disabled={busyId === order.id}
          title={orderStatusLabels[nextStatus]}
        >
          {busyId === order.id ? 'Đang lưu…' : ACTION_LABELS[nextStatus]}
        </button>
      ))}
      {orderTransitions[order.status]?.length === 0 && <span className="table__muted">—</span>}
    </div>
  )

  return (
    <section className="admin__panel">
      <header className="admin__panel-head">
        <div>
          <p className="admin__eyebrow">VẬN HÀNH</p>
          <h1 className="admin__panel-title">Đơn hàng</h1>
          <p className="admin__panel-sub">{result.total} đơn</p>
        </div>
        <div className="admin__filters">
          {FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              className={`chip${status === filter.value ? ' is-active' : ''}`}
              aria-pressed={status === filter.value}
              onClick={() => {
                setSearchParams(filter.value ? { status: filter.value } : {})
                setPage(1)
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="notice notice--error" role="alert">{error}</p>}
      {loading && <Loading label="Đang tải đơn hàng" />}

      {!loading && result.items.length === 0 && (
        <EmptyState title="Không có đơn nào" text="Chưa có đơn khớp bộ lọc hiện tại." />
      )}

      {!loading && result.items.length > 0 && (
        <>
        <div className="table-wrap admin-orders__desktop">
          <table className="table admin-orders__table">
            <thead>
              <tr>
                <th>Đơn</th>
                <th>Khách nhận</th>
                <th className="table__center-col">Món</th>
                <th>Tổng</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th className="table__actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((order) => (
                <tr key={order.id}>
                  <td className="table__id">#{order.id}</td>
                  <td>
                    <p className="table__strong">{order.receiver_name}</p>
                    <p className="table__muted">{order.phone}</p>
                  </td>
                  <td className="table__muted table__center-col">
                    {order.items.map((item) => `${item.product_name} ×${item.quantity}`).join(', ')}
                  </td>
                  <td className="table__strong admin-orders__nowrap">{formatPrice(order.total_amount)}</td>
                  <td className="admin-orders__nowrap">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="table__muted">{formatDateTime(order.created_at)}</td>
                  <td>
                    {renderActions(order)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-orders__mobile">
          {result.items.map((order) => (
            <article className="admin-order-card" key={order.id}>
              <header className="admin-order-card__head">
                <strong>Đơn #{order.id}</strong>
                <StatusBadge status={order.status} />
              </header>
              <dl className="admin-order-card__details">
                <div><dt>Khách nhận</dt><dd>{order.receiver_name}<br />{order.phone}</dd></div>
                <div><dt>Món</dt><dd>{order.items.map((item) => `${item.product_name} ×${item.quantity}`).join(', ')}</dd></div>
                <div><dt>Tổng tiền</dt><dd className="table__strong">{formatPrice(order.total_amount)}</dd></div>
                <div><dt>Thời gian</dt><dd>{formatDateTime(order.created_at)}</dd></div>
              </dl>
              <footer className="admin-order-card__actions">{renderActions(order)}</footer>
            </article>
          ))}
        </div>
        </>
      )}

      {result.total_pages > 1 && (
        <nav className="pagination" aria-label="Phân trang đơn hàng">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            Trang trước
          </button>
          <span className="pagination__status">
            Trang {page} / {result.total_pages}
          </span>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setPage((current) => Math.min(result.total_pages, current + 1))}
            disabled={page >= result.total_pages}
          >
            Trang sau
          </button>
        </nav>
      )}

      <Modal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrderId(null)}
        title={selectedOrder ? `Đơn hàng #${selectedOrder.id}` : ''}
        description={selectedOrder ? `Tạo lúc ${formatDateTime(selectedOrder.created_at)}` : ''}
        size="lg"
      >
        {selectedOrder && (
          <div className="admin-order-detail">
            <div className="admin-order-detail__summary">
              <div>
                <span className="admin-order-detail__label">Trạng thái</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div>
                <span className="admin-order-detail__label">Tổng thanh toán</span>
                <strong>{formatPrice(selectedOrder.total_amount)}</strong>
              </div>
            </div>

            <section className="admin-order-detail__section">
              <h3>Thông tin nhận hàng</h3>
              <dl className="admin-order-detail__contact">
                <div><dt>Người nhận</dt><dd>{selectedOrder.receiver_name}</dd></div>
                <div><dt>Số điện thoại</dt><dd><a href={`tel:${selectedOrder.phone}`}>{selectedOrder.phone}</a></dd></div>
                <div><dt>Địa chỉ</dt><dd>{selectedOrder.address}</dd></div>
                {selectedOrder.note && <div><dt>Ghi chú</dt><dd>{selectedOrder.note}</dd></div>}
                {selectedOrder.completed_at && <div><dt>Hoàn tất lúc</dt><dd>{formatDateTime(selectedOrder.completed_at)}</dd></div>}
              </dl>
            </section>

            <section className="admin-order-detail__section">
              <h3>Món đã đặt</h3>
              <div className="admin-order-detail__items">
                {selectedOrder.items.map((item) => (
                  <div className="admin-order-detail__item" key={item.id}>
                    <div>
                      <strong>{item.product_name}</strong>
                      <span>{formatPrice(item.unit_price)} × {item.quantity}</span>
                    </div>
                    <strong>{formatPrice(item.subtotal ?? item.unit_price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            </section>

            {orderTransitions[selectedOrder.status]?.length > 0 && (
              <section className="admin-order-detail__section">
                <h3>Cập nhật đơn</h3>
                {renderActions(selectedOrder, false)}
              </section>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}

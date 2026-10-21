import { useCallback, useState } from 'react'
import { admin as adminApi } from '../../api'
import { EmptyState, Loading, StatusBadge } from '../../components'
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
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [busyId, setBusyId] = useState(null)
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

  return (
    <section className="admin__panel">
      <header className="admin__panel-head">
        <div>
          <h1 className="admin__panel-title">Đơn hàng</h1>
          <p className="admin__panel-sub">{result.total} đơn</p>
        </div>
        <div className="admin__filters">
          {FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              className={`chip${status === filter.value ? ' is-active' : ''}`}
              onClick={() => {
                setStatus(filter.value)
                setPage(1)
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="notice notice--error">{error}</p>}
      {loading && <Loading label="Đang tải đơn hàng" />}

      {!loading && result.items.length === 0 && (
        <EmptyState title="Không có đơn nào" text="Chưa có đơn khớp bộ lọc hiện tại." />
      )}

      {!loading && result.items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Đơn</th>
                <th>Khách nhận</th>
                <th>Món</th>
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
                  <td className="table__muted">
                    {order.items.map((item) => `${item.product_name} ×${item.quantity}`).join(', ')}
                  </td>
                  <td className="table__strong">{formatPrice(order.total_amount)}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="table__muted">{formatDateTime(order.created_at)}</td>
                  <td>
                    <div className="row-actions">
                      {orderTransitions[order.status]?.map((nextStatus) => (
                        <button
                          key={nextStatus}
                          type="button"
                          className={`btn btn--sm ${
                            nextStatus === 'cancelled' ? 'btn--danger' : 'btn--primary'
                          }`}
                          onClick={() => changeStatus(order, nextStatus)}
                          disabled={busyId === order.id}
                          title={orderStatusLabels[nextStatus]}
                        >
                          {ACTION_LABELS[nextStatus]}
                        </button>
                      ))}
                      {orderTransitions[order.status]?.length === 0 && (
                        <span className="table__muted">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </section>
  )
}

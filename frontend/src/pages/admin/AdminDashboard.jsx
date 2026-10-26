import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { admin as adminApi, categories as categoriesApi, products as productsApi } from '../../api'
import { EmptyState, Loading, StatusBadge } from '../../components'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatDateTime, formatPrice } from '../../utils/format'

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'completed', 'cancelled']
const STATUS_HINTS = {
  pending: 'Cần xác nhận',
  confirmed: 'Đã nhận đơn',
  preparing: 'Đang pha chế',
  completed: 'Đã giao xong',
  cancelled: 'Đã huỷ',
}

export function AdminDashboard() {
  const loader = useCallback(async () => {
    const [recentOrders, ...rest] = await Promise.all([
      adminApi.listOrders({ page: 1, size: 6 }),
      ...STATUS_ORDER.map((status) => adminApi.listOrders({ page: 1, size: 1, status })),
      productsApi.list({ page: 1, size: 1, available_only: false }),
      productsApi.list({ page: 1, size: 1, available_only: true }),
      categoriesApi.list(),
      adminApi.getRevenue({ days: 7 }),
    ])
    const statusResults = rest.slice(0, STATUS_ORDER.length)
    const productResult = rest[STATUS_ORDER.length]
    const availableResult = rest[STATUS_ORDER.length + 1]
    const categories = rest[STATUS_ORDER.length + 2]
    const revenue = rest[STATUS_ORDER.length + 3]
    return {
      recentOrders: recentOrders.items,
      totalOrders: recentOrders.total,
      statuses: Object.fromEntries(
        STATUS_ORDER.map((status, index) => [status, statusResults[index].total]),
      ),
      totalProducts: productResult.total,
      availableProducts: availableResult.total,
      categories,
      revenue: revenue.summary,
    }
  }, [])

  const { data, error, loading } = useAsyncData(loader, 'admin-dashboard')
  const summary = data ?? {
    recentOrders: [],
    totalOrders: 0,
    statuses: {},
    totalProducts: 0,
    availableProducts: 0,
    categories: [],
    revenue: { revenue: 0, completed_orders: 0 },
  }
  const pendingCount = summary.statuses.pending ?? 0
  const hiddenCount = summary.totalProducts - summary.availableProducts

  return (
    <section className="admin__panel admin-dashboard">
      <header className="admin__panel-head">
        <div>
          <h1 className="admin__panel-title">Tổng quan</h1>
          <p className="admin__panel-sub">Tình hình đơn hàng và thực đơn của cửa hàng.</p>
        </div>
        <div className="admin-dashboard__actions">
          <Link to="/admin/analytics" className="btn btn--outline">Phân tích doanh thu</Link>
          <Link to="/admin/orders" className="btn btn--primary">Xem đơn hàng</Link>
        </div>
      </header>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      {loading && <Loading label="Đang tải tổng quan" />}

      {!loading && data && (
        <>
          <div className="admin-metrics" role="group" aria-label="Chỉ số cửa hàng">
            <article className="admin-metric admin-metric--lead">
              <span className="admin-metric__label">Doanh thu 7 ngày</span>
              <strong className="admin-metric__value">{formatPrice(summary.revenue.revenue)}</strong>
              <span className="admin-metric__hint">{summary.revenue.completed_orders} đơn hoàn tất</span>
            </article>
            <article className="admin-metric">
              <span className="admin-metric__label">Đơn hàng</span>
              <strong className="admin-metric__value">{summary.totalOrders}</strong>
              <span className="admin-metric__hint">Tất cả trạng thái</span>
            </article>
            <article className="admin-metric">
              <span className="admin-metric__label">Đang bán</span>
              <strong className="admin-metric__value">{summary.availableProducts}</strong>
              <span className="admin-metric__hint">trên {summary.totalProducts} sản phẩm</span>
            </article>
            <article className="admin-metric">
              <span className="admin-metric__label">Danh mục</span>
              <strong className="admin-metric__value">{summary.categories.length}</strong>
              <span className="admin-metric__hint">nhóm trên thực đơn</span>
            </article>
          </div>

          <section className="admin-dashboard__attention" aria-labelledby="admin-attention-title">
            <div className="admin-dashboard__section-head">
              <div>
                <h2 className="admin__form-title" id="admin-attention-title">Cần xử lý</h2>
                <p className="admin__panel-sub">Các mục có thể cần bạn kiểm tra.</p>
              </div>
            </div>
            {pendingCount + hiddenCount > 0 ? (
              <div className="admin-dashboard__attention-grid">
                {pendingCount > 0 && (
                  <Link to="/admin/orders?status=pending" className="admin-attention-card">
                    <span className="admin-attention-card__label">Đơn chờ xác nhận</span>
                    <strong>{pendingCount}</strong>
                    <span className="admin-attention-card__action">Xem danh sách đơn</span>
                  </Link>
                )}
                {hiddenCount > 0 && (
                  <Link to="/admin/products" className="admin-attention-card">
                    <span className="admin-attention-card__label">Món đang ẩn</span>
                    <strong>{hiddenCount}</strong>
                    <span className="admin-attention-card__action">Xem thực đơn</span>
                  </Link>
                )}
              </div>
            ) : (
              <p className="admin-dashboard__all-clear">Hiện không có đơn chờ xác nhận hoặc món đang ẩn.</p>
            )}
          </section>

          <section className="admin-dashboard__section" aria-labelledby="admin-status-title">
            <div className="admin-dashboard__section-head">
              <div>
                <h2 className="admin__form-title" id="admin-status-title">Trạng thái đơn hàng</h2>
                <p className="admin__panel-sub">Số đơn hiện có trong từng bước xử lý.</p>
              </div>
              <Link to="/admin/orders" className="text-link">Quản lý đơn</Link>
            </div>
            <div className="admin-dashboard__statuses">
              {STATUS_ORDER.map((status) => (
                <Link
                  className="admin-status"
                  key={status}
                  to={`/admin/orders?status=${status}`}
                >
                  <StatusBadge status={status} />
                  <strong className="admin-status__count">{summary.statuses[status] ?? 0}</strong>
                  <span className="admin-status__hint">{STATUS_HINTS[status]}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="admin-dashboard__section" aria-labelledby="admin-recent-title">
            <div className="admin-dashboard__section-head">
              <div>
                <h2 className="admin__form-title" id="admin-recent-title">Đơn hàng mới</h2>
                <p className="admin__panel-sub">6 đơn được tạo gần đây nhất.</p>
              </div>
              <Link to="/admin/orders" className="text-link">Xem tất cả</Link>
            </div>
            {summary.recentOrders.length === 0 ? (
              <EmptyState title="Chưa có đơn hàng" text="Đơn mới sẽ xuất hiện tại đây." />
            ) : (
              <div className="table-wrap">
                <table className="table admin-dashboard__table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách nhận</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="table__id">#{order.id}</td>
                        <td><span className="table__strong">{order.receiver_name}</span></td>
                        <td className="table__strong">{formatPrice(order.total_amount)}</td>
                        <td><StatusBadge status={order.status} /></td>
                        <td className="table__muted">{formatDateTime(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-dashboard__quick-links" aria-label="Lối tắt quản trị">
            <Link to="/admin/products" className="admin-quick-link">
              <span><strong>Thực đơn</strong><small>Thêm món, cập nhật giá và trạng thái bán</small></span>
            </Link>
            <Link to="/admin/categories" className="admin-quick-link">
              <span><strong>Danh mục</strong><small>Sắp xếp nhóm món trên thực đơn</small></span>
            </Link>
          </section>
        </>
      )}
    </section>
  )
}

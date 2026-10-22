import { useCallback, useState } from 'react'
import { categories as categoriesApi, products as productsApi } from '../../api'
import { EmptyState, Loading } from '../../components'
import { useConfirm } from '../../context/useConfirm'
import { useToast } from '../../context/useToast'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatPrice } from '../../utils/format'

export function AdminProducts() {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({ name: '', price: '' })
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const confirm = useConfirm()
  const { notify } = useToast()

  const categoryLoader = useCallback(() => categoriesApi.list(), [])
  const { data: categories } = useAsyncData(categoryLoader, 'admin-categories')

  const productLoader = useCallback(
    () => productsApi.list({ page: 1, size: 100, available_only: false }),
    [],
  )
  const { data, error: loadError, loading, update } = useAsyncData(productLoader, 'admin-products')
  const result = data ?? { items: [], total: 0 }
  const error = actionError || loadError

  const categoryName = (id) => categories?.find((item) => item.id === id)?.name ?? '—'

  const startEdit = (product) => {
    setEditingId(product.id)
    setDraft({ name: product.name, price: String(product.price) })
    setActionError('')
  }

  const saveEdit = async (product) => {
    const price = Number(draft.price)
    if (!draft.name.trim() || !Number.isFinite(price) || price <= 0) {
      setActionError('Tên món không được trống và giá phải lớn hơn 0.')
      return
    }
    setBusyId(product.id)
    setActionError('')
    try {
      const updated = await productsApi.update(product.id, {
        name: draft.name.trim(),
        price: Math.round(price),
      })
      update((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === product.id ? updated : item)),
      }))
      setEditingId(null)
    } catch (requestError) {
      setActionError(requestError.detail ?? 'Không lưu được thay đổi.')
    } finally {
      setBusyId(null)
    }
  }

  const hideProduct = async (product) => {
    const confirmed = await confirm({
      title: 'Ẩn món khỏi thực đơn?',
      message: `Món "${product.name}" sẽ không còn hiện với khách. Bạn có thể mở lại bất cứ lúc nào.`,
      confirmText: 'Ẩn món',
      cancelText: 'Giữ nguyên',
      danger: true,
    })
    if (!confirmed) return

    setBusyId(product.id)
    setActionError('')
    try {
      await productsApi.remove(product.id)
      update((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === product.id ? { ...item, is_available: false } : item,
        ),
      }))
      notify(`Đã ẩn món "${product.name}".`, { type: 'success' })
    } catch (requestError) {
      setActionError(requestError.detail ?? 'Không ẩn được món này.')
      notify(requestError.detail ?? 'Không ẩn được món này.', { type: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="admin__panel">
      <header className="admin__panel-head">
        <div>
          <h1 className="admin__panel-title">Sản phẩm</h1>
          <p className="admin__panel-sub">{result.total} món trên thực đơn</p>
        </div>
      </header>

      {error && <p className="notice notice--error">{error}</p>}
      {loading && <Loading label="Đang tải sản phẩm" />}

      {!loading && result.items.length === 0 && (
        <EmptyState title="Chưa có món nào" text="Thêm món mới để khách đặt được." />
      )}

      {!loading && result.items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Món</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th className="table__actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((product) => {
                const editing = editingId === product.id
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="cell-product">
                        <img
                          src={product.image_url}
                          alt=""
                          width="48"
                          height="48"
                          loading="lazy"
                        />
                        {editing ? (
                          <input
                            className="field__control field__control--sm"
                            value={draft.name}
                            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                            aria-label="Tên món"
                          />
                        ) : (
                          <span className="table__strong">{product.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="table__muted">{categoryName(product.category_id)}</td>
                    <td>
                      {editing ? (
                        <input
                          className="field__control field__control--sm"
                          type="number"
                          min="0"
                          step="1000"
                          value={draft.price}
                          onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                          aria-label="Giá món"
                        />
                      ) : (
                        <span className="table__strong">{formatPrice(product.price)}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${product.is_available ? 'badge--ok' : 'badge--muted'}`}>
                        {product.is_available ? 'Đang bán' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {editing ? (
                          <>
                            <button
                              type="button"
                              className="btn btn--sm btn--primary"
                              onClick={() => saveEdit(product)}
                              disabled={busyId === product.id}
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              className="btn btn--sm btn--outline"
                              onClick={() => setEditingId(null)}
                            >
                              Huỷ
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn--sm btn--outline"
                              onClick={() => startEdit(product)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="btn btn--sm btn--danger"
                              onClick={() => hideProduct(product)}
                              disabled={busyId === product.id}
                            >
                              Ẩn
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

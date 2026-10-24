import { useCallback, useState } from 'react'
import { categories as categoriesApi, products as productsApi } from '../../api'
import { EmptyState, Loading } from '../../components'
import { useConfirm } from '../../context/useConfirm'
import { useToast } from '../../context/useToast'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatPrice } from '../../utils/format'

const EMPTY_FORM = {
  category_id: '',
  name: '',
  slug: '',
  description: '',
  image_url: '',
  price: '',
  is_available: true,
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function AdminProducts() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState('all')
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
  const visibleItems = result.items.filter((product) => {
    const matchesSearch = `${product.name} ${product.slug}`.toLowerCase().includes(search.trim().toLowerCase())
    const matchesAvailability =
      availability === 'all' || product.is_available === (availability === 'available')
    return matchesSearch && matchesAvailability
  })

  const updateField = (field) => (event) => {
    const value = field === 'is_available' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setActionError('')
  }

  const startEdit = (product) => {
    setShowForm(true)
    setEditingId(product.id)
    setForm({
      category_id: String(product.category_id),
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      image_url: product.image_url ?? '',
      price: String(product.price),
      is_available: product.is_available,
    })
    setActionError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setActionError('')
    setShowForm(false)
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    const price = Number(form.price)
    if (!form.name.trim()) {
      setActionError('Vui lòng nhập tên món.')
      return
    }
    if (!form.category_id) {
      setActionError('Vui lòng chọn danh mục.')
      return
    }
    if (!form.slug.trim() && !slugify(form.name)) {
      setActionError('Tên món chưa tạo được slug hợp lệ.')
      return
    }
    if (!form.price.trim() || !Number.isInteger(price) || price < 0) {
      setActionError('Giá phải là số nguyên từ 0 trở lên.')
      return
    }

    const payload = {
      category_id: Number(form.category_id),
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      price,
      is_available: form.is_available,
    }
    const id = editingId
    setBusyId(id ?? 'create')
    setActionError('')
    try {
      if (id) {
        const updated = await productsApi.update(id, payload)
        update((current) => ({
          ...current,
          items: current.items.map((item) => (item.id === id ? updated : item)),
        }))
        notify(`Đã cập nhật món “${updated.name}”.`, { type: 'success' })
      } else {
        const created = await productsApi.create({
          ...payload,
          description: payload.description || null,
          image_url: payload.image_url || null,
        })
        update((current) => ({
          ...current,
          items: [created, ...current.items],
          total: current.total + 1,
        }))
        notify(`Đã thêm món “${created.name}”.`, { type: 'success' })
      }
      cancelEdit()
    } catch (requestError) {
      setActionError(requestError.detail ?? 'Không lưu được sản phẩm.')
    } finally {
      setBusyId(null)
    }
  }

  const toggleAvailability = async (product) => {
    if (product.is_available) {
      const confirmed = await confirm({
        title: 'Ẩn món khỏi thực đơn?',
        message: `Khách sẽ không thể đặt “${product.name}” cho đến khi bạn mở bán lại.`,
        confirmText: 'Ẩn món',
        cancelText: 'Giữ nguyên',
        danger: true,
      })
      if (!confirmed) return
    }

    setBusyId(product.id)
    setActionError('')
    try {
      if (product.is_available) {
        await productsApi.remove(product.id)
      } else {
        await productsApi.update(product.id, { is_available: true })
      }
      update((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === product.id ? { ...item, is_available: !product.is_available } : item,
        ),
      }))
      notify(`${product.is_available ? 'Đã ẩn' : 'Đã mở bán'} món “${product.name}”.`, {
        type: 'success',
      })
    } catch (requestError) {
      const message = requestError.detail ?? 'Không cập nhật được trạng thái món.'
      setActionError(message)
      notify(message, { type: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  const permanentlyDeleteProduct = async (product) => {
    const confirmed = await confirm({
      title: `Xóa món “${product.name}”?`,
      message:
        'Món đã ẩn sẽ bị xóa vĩnh viễn và không thể khôi phục. Món có lịch sử đơn hàng sẽ được giữ lại để bảo toàn dữ liệu.',
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Giữ lại',
      danger: true,
    })
    if (!confirmed) return

    setBusyId(product.id)
    setActionError('')
    try {
      await productsApi.deletePermanently(product.id)
      update((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== product.id),
        total: Math.max(0, current.total - 1),
      }))
      notify(`Đã xóa vĩnh viễn món “${product.name}”.`, { type: 'success' })
    } catch (requestError) {
      const message = requestError.detail ?? 'Không xóa được món.'
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
          <p className="admin__eyebrow">THỰC ĐƠN</p>
          <h1 className="admin__panel-title">Sản phẩm</h1>
          <p className="admin__panel-sub">{result.total} món trong thực đơn</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          aria-expanded={showForm}
          aria-controls="admin-product-form"
          disabled={editingId !== null}
          onClick={() => setShowForm((open) => !open)}
        >
          {showForm ? 'Đóng biểu mẫu' : '+ Thêm món'}
        </button>
      </header>

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      {showForm && (
      <form id="admin-product-form" className="admin__form admin__form--card" onSubmit={saveProduct} noValidate>
        <div className="admin__form-head">
          <div>
            <h2 className="admin__form-title">{editingId ? 'Cập nhật món' : 'Thêm món mới'}</h2>
            <p className="admin__panel-sub">Thông tin này sẽ hiển thị trên thực đơn của khách.</p>
          </div>
          {editingId && (
            <button type="button" className="btn btn--outline btn--sm" onClick={cancelEdit}>
              Huỷ chỉnh sửa
            </button>
          )}
        </div>

        <div className="admin__form-grid">
          <div className="field">
            <label className="field__label" htmlFor="product-name">Tên món</label>
            <input id="product-name" className="field__control" value={form.name} onChange={updateField('name')} aria-required="true" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="product-category">Danh mục</label>
            <select id="product-category" className="field__control" value={form.category_id} onChange={updateField('category_id')} aria-required="true">
              <option value="">Chọn danh mục</option>
              {(categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="product-slug">Slug</label>
            <input id="product-slug" className="field__control" value={form.slug} onChange={updateField('slug')} placeholder="Tự tạo từ tên món" />
            <span className="field__hint">Để trống để tự tạo slug từ tên món.</span>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="product-price">Giá (VND)</label>
            <input id="product-price" className="field__control" type="number" min="0" step="1000" value={form.price} onChange={updateField('price')} aria-required="true" />
          </div>
          <div className="field admin__form-span">
            <label className="field__label" htmlFor="product-image">Đường dẫn ảnh</label>
            <input id="product-image" className="field__control" type="url" value={form.image_url} onChange={updateField('image_url')} placeholder="https://…" />
          </div>
          <div className="field admin__form-span">
            <label className="field__label" htmlFor="product-description">Mô tả</label>
            <textarea id="product-description" className="field__control" rows="3" value={form.description} onChange={updateField('description')} />
          </div>
        </div>

        <label className="admin-check">
          <input type="checkbox" checked={form.is_available} onChange={updateField('is_available')} />
          <span>Mở bán ngay sau khi lưu</span>
        </label>
        <div className="admin__form-actions">
          <button type="submit" className="btn btn--primary" disabled={busyId !== null || !categories?.length}>
            {busyId === 'create' ? 'Đang thêm…' : editingId ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
          </button>
        </div>
      </form>
      )}

      <div className="admin__toolbar">
        <label className="search admin__search">
          <span className="visually-hidden">Tìm sản phẩm</span>
          <input className="search__input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc slug…" />
        </label>
        <label className="admin__select-wrap">
          <span className="visually-hidden">Lọc trạng thái sản phẩm</span>
          <select className="field__control" value={availability} onChange={(event) => setAvailability(event.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Đang bán</option>
            <option value="hidden">Đã ẩn</option>
          </select>
        </label>
        <span className="admin__result-count">{visibleItems.length} món</span>
      </div>

      {loading && <Loading label="Đang tải sản phẩm" />}
      {!loading && visibleItems.length === 0 && (
        <EmptyState title={result.items.length ? 'Không tìm thấy món phù hợp' : 'Chưa có món nào'} text={result.items.length ? 'Thử đổi từ khoá hoặc bộ lọc trạng thái.' : 'Dùng nút “+ Thêm món” để tạo món đầu tiên.'} />
      )}
      {!loading && visibleItems.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Món</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th><th className="table__actions-col">Thao tác</th></tr></thead>
            <tbody>
              {visibleItems.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="cell-product">
                      <img src={product.image_url || '/images/highland-brew.jpg'} alt="" width="48" height="48" loading="lazy" />
                      <span><strong className="table__strong">{product.name}</strong><small className="admin__product-slug">{product.slug}</small></span>
                    </div>
                  </td>
                  <td className="table__muted">{categoryName(product.category_id)}</td>
                  <td><span className="table__strong">{formatPrice(product.price)}</span></td>
                  <td><span className={`badge ${product.is_available ? 'badge--ok' : 'badge--muted'}`}>{product.is_available ? 'Đang bán' : 'Đã ẩn'}</span></td>
                  <td><div className="row-actions">
                    <button type="button" className="btn btn--sm btn--outline" onClick={() => startEdit(product)}>Sửa</button>
                    <button type="button" className="btn btn--sm btn--outline" onClick={() => toggleAvailability(product)} disabled={busyId === product.id}>
                      {busyId === product.id ? 'Đang lưu…' : product.is_available ? 'Ẩn món' : 'Mở bán'}
                    </button>
                    {!product.is_available && (
                      <button
                        type="button"
                        className="btn btn--sm btn--danger"
                        onClick={() => permanentlyDeleteProduct(product)}
                        disabled={busyId === product.id}
                      >
                        {busyId === product.id ? 'Đang xóa…' : 'Xóa món'}
                      </button>
                    )}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

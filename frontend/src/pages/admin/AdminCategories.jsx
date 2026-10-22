import { useCallback, useState } from 'react'
import { categories as categoriesApi, products as productsApi } from '../../api'
import { EmptyState, Loading } from '../../components'
import { useConfirm } from '../../context/useConfirm'
import { useToast } from '../../context/useToast'
import { useAsyncData } from '../../hooks/useAsyncData'

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function AdminCategories() {
  const [form, setForm] = useState({ name: '', slug: '', description: '' })
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({ name: '', slug: '', description: '' })
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const confirm = useConfirm()
  const { notify } = useToast()

  const loader = useCallback(async () => {
    const [categoryList, productList] = await Promise.all([
      categoriesApi.list(),
      productsApi.list({ page: 1, size: 100, available_only: false }),
    ])
    const counts = {}
    productList.items.forEach((product) => {
      counts[product.category_id] = (counts[product.category_id] ?? 0) + 1
    })
    return { categories: categoryList, counts }
  }, [])

  const { data, error: loadError, loading, update } = useAsyncData(loader, 'admin-categories')
  const items = data?.categories ?? []
  const counts = data?.counts ?? {}
  const error = actionError || loadError

  const handleCreate = async (event) => {
    event.preventDefault()
    setActionError('')
    setNotice('')
    if (!form.name.trim()) {
      setActionError('Tên danh mục không được trống.')
      return
    }
    setBusyId('create')
    try {
      const created = await categoriesApi.create({
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || null,
      })
      update((current) => ({ ...current, categories: [...current.categories, created] }))
      setForm({ name: '', slug: '', description: '' })
      setNotice(`Đã thêm danh mục “${created.name}”.`)
    } catch (requestError) {
      setActionError(requestError.detail ?? 'Không tạo được danh mục.')
    } finally {
      setBusyId(null)
    }
  }

  const startEdit = (category) => {
    setEditingId(category.id)
    setDraft({ name: category.name, slug: category.slug, description: category.description ?? '' })
    setActionError('')
    setNotice('')
  }

  const saveEdit = async (category) => {
    setBusyId(category.id)
    setActionError('')
    try {
      const updated = await categoriesApi.update(category.id, {
        name: draft.name.trim(),
        slug: draft.slug.trim() || slugify(draft.name),
        description: draft.description.trim() || null,
      })
      update((current) => ({
        ...current,
        categories: current.categories.map((item) => (item.id === category.id ? updated : item)),
      }))
      setEditingId(null)
      setNotice(`Đã cập nhật danh mục “${updated.name}”.`)
    } catch (requestError) {
      setActionError(requestError.detail ?? 'Không lưu được danh mục.')
    } finally {
      setBusyId(null)
    }
  }

  const removeCategory = async (category) => {
    const confirmed = await confirm({
      title: 'Xoá danh mục?',
      message: `Danh mục "${category.name}" sẽ bị xoá. Danh mục còn sản phẩm sẽ không xoá được.`,
      confirmText: 'Xoá danh mục',
      cancelText: 'Giữ lại',
      danger: true,
    })
    if (!confirmed) return

    setBusyId(category.id)
    setActionError('')
    setNotice('')
    try {
      await categoriesApi.remove(category.id)
      update((current) => ({
        ...current,
        categories: current.categories.filter((item) => item.id !== category.id),
      }))
      setNotice(`Đã xoá danh mục "${category.name}".`)
      notify(`Đã xoá danh mục "${category.name}".`, { type: 'success' })
    } catch (requestError) {
      setActionError(
        requestError.detail ??
          'Danh mục còn sản phẩm nên không xoá được. Chuyển sản phẩm sang danh mục khác trước.',
      )
      notify(requestError.detail ?? 'Không xoá được danh mục.', { type: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="admin__panel">
      <header className="admin__panel-head">
        <div>
          <h1 className="admin__panel-title">Danh mục</h1>
          <p className="admin__panel-sub">{items.length} nhóm trên thực đơn</p>
        </div>
      </header>

      {error && <p className="notice notice--error">{error}</p>}
      {notice && <p className="notice notice--success">{notice}</p>}
      {loading && <Loading label="Đang tải danh mục" />}

      {!loading && items.length === 0 && (
        <EmptyState title="Chưa có danh mục" text="Thêm nhóm đầu tiên để gắn món vào." />
      )}

      {!loading && items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Danh mục</th>
                <th>Slug</th>
                <th>Mô tả</th>
                <th>Sản phẩm</th>
                <th className="table__actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((category) => {
                const editing = editingId === category.id
                return (
                  <tr key={category.id}>
                    <td>
                      {editing ? (
                        <input
                          className="field__control field__control--sm"
                          value={draft.name}
                          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                          aria-label="Tên danh mục"
                        />
                      ) : (
                        <span className="table__strong">{category.name}</span>
                      )}
                    </td>
                    <td className="table__muted">
                      {editing ? (
                        <input
                          className="field__control field__control--sm"
                          value={draft.slug}
                          onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                          aria-label="Slug danh mục"
                        />
                      ) : (
                        category.slug
                      )}
                    </td>
                    <td className="table__muted">
                      {editing ? (
                        <input
                          className="field__control field__control--sm"
                          value={draft.description}
                          onChange={(event) =>
                            setDraft({ ...draft, description: event.target.value })
                          }
                          aria-label="Mô tả danh mục"
                        />
                      ) : (
                        category.description
                      )}
                    </td>
                    <td className="table__muted">{counts[category.id] ?? 0}</td>
                    <td>
                      <div className="row-actions">
                        {editing ? (
                          <>
                            <button
                              type="button"
                              className="btn btn--sm btn--primary"
                              onClick={() => saveEdit(category)}
                              disabled={busyId === category.id}
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
                              onClick={() => startEdit(category)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="btn btn--sm btn--danger"
                              onClick={() => removeCategory(category)}
                              disabled={busyId === category.id}
                            >
                              Xoá
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

      <form className="admin__form" onSubmit={handleCreate}>
        <h2 className="admin__form-title">Thêm danh mục</h2>
        <div className="admin__form-row">
          <div className="field">
            <label className="field__label" htmlFor="cat-name">
              Tên
            </label>
            <input
              id="cat-name"
              className="field__control"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="cat-slug">
              Slug
            </label>
            <input
              id="cat-slug"
              className="field__control"
              value={form.slug}
              placeholder="tu-dong-tao"
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="cat-desc">
            Mô tả
          </label>
          <input
            id="cat-desc"
            className="field__control"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </div>
        <button type="submit" className="btn btn--primary" disabled={busyId === 'create'}>
          {busyId === 'create' ? 'Đang lưu' : 'Thêm danh mục'}
        </button>
      </form>
    </section>
  )
}

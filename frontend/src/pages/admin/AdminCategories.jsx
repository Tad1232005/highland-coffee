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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [search, setSearch] = useState('')
  const confirm = useConfirm()
  const { notify } = useToast()

  const loader = useCallback(async () => {
    const categoryList = await categoriesApi.list()
    const productCounts = await Promise.all(
      categoryList.map((category) =>
        productsApi.list({ category_id: category.id, page: 1, size: 1, available_only: false }),
      ),
    )
    const counts = {}
    categoryList.forEach((category, index) => {
      counts[category.id] = productCounts[index].total
    })
    return { categories: categoryList, counts }
  }, [])

  const { data, error: loadError, loading, update } = useAsyncData(loader, 'admin-categories')
  const items = data?.categories ?? []
  const counts = data?.counts ?? {}
  const error = actionError || loadError
  const visibleItems = items.filter((category) =>
    `${category.name} ${category.slug} ${category.description ?? ''}`
      .toLocaleLowerCase('vi')
      .includes(search.trim().toLocaleLowerCase('vi')),
  )

  const handleCreate = async (event) => {
    event.preventDefault()
    setActionError('')
    setNotice('')
    const slug = form.slug.trim() ? slugify(form.slug) : slugify(form.name)
    if (!form.name.trim()) {
      setActionError('Tên danh mục không được trống.')
      return
    }
    if (!slug) {
      setActionError('Vui lòng nhập tên danh mục hoặc slug hợp lệ.')
      return
    }
    setBusyId('create')
    try {
      const created = await categoriesApi.create({
        name: form.name.trim(),
        slug,
        description: form.description.trim() || null,
      })
      update((current) => ({ ...current, categories: [...current.categories, created] }))
      setForm({ name: '', slug: '', description: '' })
      setNotice(`Đã thêm danh mục “${created.name}”.`)
      setShowCreateForm(false)
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
    const slug = draft.slug.trim() ? slugify(draft.slug) : slugify(draft.name)
    if (!draft.name.trim()) {
      setActionError('Tên danh mục không được để trống.')
      return
    }
    if (!slug) {
      setActionError('Slug danh mục không hợp lệ.')
      return
    }
    setBusyId(category.id)
    setActionError('')
    try {
      const updated = await categoriesApi.update(category.id, {
        name: draft.name.trim(),
        slug,
        description: draft.description.trim(),
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
          <p className="admin__eyebrow">THỰC ĐƠN</p>
          <h1 className="admin__panel-title">Danh mục</h1>
          <p className="admin__panel-sub">Quản lý nhóm món và theo dõi số sản phẩm trong từng nhóm.</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          aria-expanded={showCreateForm}
          aria-controls="admin-category-create-form"
          onClick={() => setShowCreateForm((open) => !open)}
        >
          {showCreateForm ? 'Đóng biểu mẫu' : '+ Thêm danh mục'}
        </button>
      </header>

      {error && <p className="notice notice--error">{error}</p>}
      {notice && <p className="notice notice--success">{notice}</p>}
      {loading && <Loading label="Đang tải danh mục" />}

      {showCreateForm && (
        <form
          id="admin-category-create-form"
          className="admin__form admin__form--card"
          onSubmit={handleCreate}
          noValidate
        >
          <h2 className="admin__form-title">Thêm danh mục</h2>
          <div className="admin__form-row">
            <div className="field">
              <label className="field__label" htmlFor="cat-name">Tên</label>
              <input
                id="cat-name"
                className="field__control"
                value={form.name}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value })
                  setActionError('')
                }}
                aria-required="true"
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cat-slug">Slug</label>
              <input
                id="cat-slug"
                className="field__control"
                value={form.slug}
                placeholder="tu-dong-tao"
                onChange={(event) => {
                  setForm({ ...form, slug: event.target.value })
                  setActionError('')
                }}
              />
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="cat-desc">Mô tả</label>
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
      )}

      {!loading && items.length > 0 && (
        <div className="admin__toolbar admin-categories__toolbar">
          <label className="search admin__search">
            <span className="visually-hidden">Tìm danh mục</span>
            <input
              className="search__input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, slug hoặc mô tả…"
            />
          </label>
          <span className="admin__result-count">
            {visibleItems.length} / {items.length} danh mục
          </span>
        </div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState title="Chưa có danh mục" text="Dùng nút “Thêm danh mục” để tạo nhóm đầu tiên." />
      )}

      {!loading && items.length > 0 && visibleItems.length === 0 && (
        <EmptyState title="Không tìm thấy danh mục" text="Thử từ khoá khác hoặc xoá nội dung tìm kiếm." />
      )}

      {!loading && visibleItems.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Danh mục</th>
                <th>Slug</th>
                <th>Mô tả</th>
                <th className="table__center-col">Sản phẩm</th>
                <th className="table__actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((category) => {
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
                    <td className="table__muted table__center-col">{counts[category.id] ?? 0}</td>
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

    </section>
  )
}

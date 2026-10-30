import { useCallback, useState } from 'react'
import { categories as categoriesApi, products as productsApi } from '../../api'
import { EmptyState, Loading } from '../../components'
import { IconPlus, IconSearch, IconX } from '../../components/icons'
import { useConfirm } from '../../context/useConfirm'
import { useToast } from '../../context/useToast'
import { useAsyncData } from '../../hooks/useAsyncData'
import { normalizeSearch, slugify } from '../../utils/format'

const EMPTY_FORM = { name: '', slug: '', description: '' }

export function AdminCategories() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(EMPTY_FORM)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
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
  const keyword = normalizeSearch(search.trim())
  const visibleItems = items.filter((category) =>
    normalizeSearch(`${category.name} ${category.slug} ${category.description ?? ''}`).includes(
      keyword,
    ),
  )

  const handleCreate = async (event) => {
    event.preventDefault()
    setActionError('')
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
      setForm(EMPTY_FORM)
      setShowCreateForm(false)
      notify(`Đã thêm danh mục “${created.name}”.`, { type: 'success' })
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
      notify(`Đã cập nhật danh mục “${updated.name}”.`, { type: 'success' })
    } catch (requestError) {
      setActionError(requestError.detail ?? 'Không lưu được danh mục.')
    } finally {
      setBusyId(null)
    }
  }

  const removeCategory = async (category) => {
    const confirmed = await confirm({
      title: `Xoá danh mục “${category.name}”?`,
      message: 'Danh mục còn sản phẩm sẽ không xoá được. Chuyển sản phẩm sang danh mục khác trước.',
      confirmText: 'Xoá danh mục',
      cancelText: 'Giữ lại',
      danger: true,
    })
    if (!confirmed) return

    setBusyId(category.id)
    setActionError('')
    try {
      await categoriesApi.remove(category.id)
      update((current) => ({
        ...current,
        categories: current.categories.filter((item) => item.id !== category.id),
      }))
      notify(`Đã xoá danh mục “${category.name}”.`, { type: 'success' })
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

  const renderActions = (category, editing, className) => (
    <div className={className}>
      {editing ? (
        <>
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={() => saveEdit(category)}
            disabled={busyId === category.id}
            aria-label={`Lưu danh mục ${category.name}`}
          >
            {busyId === category.id ? 'Đang lưu…' : 'Lưu'}
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
            aria-label={`Sửa danh mục ${category.name}`}
          >
            Sửa
          </button>
          <button
            type="button"
            className="btn btn--sm btn--danger"
            onClick={() => removeCategory(category)}
            disabled={busyId === category.id}
            aria-label={`Xoá danh mục ${category.name}`}
          >
            Xoá
          </button>
        </>
      )}
    </div>
  )

  return (
    <section className="admin__panel">
      <header className="admin__panel-head">
        <div>
          <h1 className="admin__panel-title">Danh mục</h1>
          <p className="admin__panel-sub">Quản lý nhóm món và theo dõi số sản phẩm trong từng nhóm.</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          aria-expanded={showCreateForm}
          aria-controls="admin-category-create-form"
          onClick={() => {
            if (showCreateForm) setForm(EMPTY_FORM)
            setShowCreateForm((open) => !open)
          }}
        >
          {showCreateForm ? <IconX width={16} height={16} /> : <IconPlus width={16} height={16} />}
          {showCreateForm ? 'Đóng biểu mẫu' : 'Thêm danh mục'}
        </button>
      </header>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
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
          <div className="admin__form-actions">
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => {
                setForm(EMPTY_FORM)
                setActionError('')
                setShowCreateForm(false)
              }}
            >
              Huỷ
            </button>
            <button type="submit" className="btn btn--primary" disabled={busyId === 'create'}>
              {busyId === 'create' ? 'Đang lưu…' : 'Thêm danh mục'}
            </button>
          </div>
        </form>
      )}

      {!loading && items.length > 0 && (
        <div className="admin__toolbar">
          <label className="search search--with-icon admin__search">
            <span className="search__icon">
              <IconSearch width={16} height={16} />
            </span>
            <span className="visually-hidden">Tìm danh mục</span>
            <input
              className="search__input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, slug hoặc mô tả…"
            />
            {search && (
              <button
                type="button"
                className="search__clear"
                onClick={() => setSearch('')}
                aria-label="Xoá từ khoá tìm kiếm"
              >
                <IconX width={14} height={14} />
              </button>
            )}
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
        <>
          <div className="table-wrap admin-categories__desktop">
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
                    <tr key={category.id} className={editing ? 'is-editing' : undefined}>
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
                      <td>{renderActions(category, editing, 'row-actions')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-categories__mobile">
            {visibleItems.map((category) => {
              const editing = editingId === category.id
              return (
                <article
                  className={`admin-category-card${editing ? ' admin-category-card--editing' : ''}`}
                  key={category.id}
                >
                  {editing ? (
                    <div className="admin-category-card__form">
                      <div className="field">
                        <label className="field__label" htmlFor={`cat-name-${category.id}`}>
                          Tên danh mục
                        </label>
                        <input
                          id={`cat-name-${category.id}`}
                          className="field__control"
                          value={draft.name}
                          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label className="field__label" htmlFor={`cat-slug-${category.id}`}>
                          Slug
                        </label>
                        <input
                          id={`cat-slug-${category.id}`}
                          className="field__control"
                          value={draft.slug}
                          onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label className="field__label" htmlFor={`cat-desc-${category.id}`}>
                          Mô tả
                        </label>
                        <input
                          id={`cat-desc-${category.id}`}
                          className="field__control"
                          value={draft.description}
                          onChange={(event) =>
                            setDraft({ ...draft, description: event.target.value })
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="admin-category-card__head">
                        <strong>{category.name}</strong>
                        <span className="badge badge--muted">
                          {counts[category.id] ?? 0} sản phẩm
                        </span>
                      </div>
                      {category.description && (
                        <p className="admin-category-card__desc">{category.description}</p>
                      )}
                      <span className="admin-category-card__slug">{category.slug}</span>
                    </>
                  )}
                  {renderActions(category, editing, 'admin-category-card__actions')}
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

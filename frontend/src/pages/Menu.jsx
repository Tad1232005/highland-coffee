import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { categories as categoriesApi, products as productsApi } from '../api'
import { CategoryTabs, EmptyState, Loading, ProductCard } from '../components'
import { IconSearch, IconX } from '../components/icons'
import { useCart } from '../context/useCart'
import { useAsyncData } from '../hooks/useAsyncData'

const PRICE_RANGES = [
  { value: '', label: 'Mọi mức giá' },
  { value: 'under-35', label: 'Dưới 35.000 đ' },
  { value: '35-50', label: '35.000 – 50.000 đ' },
  { value: 'over-50', label: 'Trên 50.000 đ' },
]

const PAGE_SIZE = 12
const EMPTY_RESULT = { items: [], total: 0, total_pages: 0 }

export function Menu() {
  const { add, mutating } = useCart()
  const [categoryId, setCategoryId] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [page, setPage] = useState(1)
  const [categoryReloadCount, setCategoryReloadCount] = useState(0)
  const [productReloadCount, setProductReloadCount] = useState(0)

  const searchTimer = useRef(null)

  useEffect(() => {
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current)
    }
  }, [])

  const priceQuery = useMemo(() => {
    if (priceRange === 'under-35') return { max_price: 34999 }
    if (priceRange === '35-50') return { min_price: 35000, max_price: 50000 }
    if (priceRange === 'over-50') return { min_price: 50001 }
    return {}
  }, [priceRange])

  const handleKeyword = (value) => {
    setKeyword(value)
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      setSearch(value.trim())
      setPage(1)
    }, 300)
  }

  const clearSearch = () => {
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current)
      searchTimer.current = null
    }
    setKeyword('')
    setSearch('')
    setPage(1)
  }

  const categoryLoader = useCallback(() => categoriesApi.list(), [])
  const { data: categoriesData, error: categoryError } = useAsyncData(
    categoryLoader,
    `categories-${categoryReloadCount}`,
  )
  const categories = useMemo(() => categoriesData ?? [], [categoriesData])


  const activeCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  )

  const activePriceLabel = useMemo(
    () => PRICE_RANGES.find((r) => r.value === priceRange)?.label ?? '',
    [priceRange],
  )

  const productLoader = useCallback(
    () =>
      productsApi.list({
        q: search || undefined,
        category_id: categoryId ?? undefined,
        ...priceQuery,
        page,
        size: PAGE_SIZE,
      }),
    [search, categoryId, priceQuery, page],
  )

  const key = JSON.stringify([search, categoryId, priceRange, page, productReloadCount])
  const { data, error, loading } = useAsyncData(productLoader, key)
  const result = data ?? EMPTY_RESULT

  const handleAdd = async (product) => {
    await add(product, 1)
  }

  const resetFilters = () => {
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current)
      searchTimer.current = null
    }
    setKeyword('')
    setSearch('')
    setPriceRange('')
    setCategoryId(null)
    setPage(1)
  }

  const hasActiveFilters = Boolean(categoryId !== null || priceRange !== '' || keyword !== '')

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <div className="page-head__row">
            <h1 className="page-head__title">Thực đơn</h1>
            <p className="menu-result">
              {loading ? 'Đang tìm…' : error ? 'Chưa tải được món' : `${result.total} món phù hợp`}
            </p>
          </div>
          <p className="page-head__lead">
            Chọn nhóm món bên dưới, hoặc tìm theo tên và khoảng giá để tới đúng ly bạn đang cần.
          </p>
        </div>

        {categoryError && (
          <div className="notice notice--error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="notice__content">
              <span>Không tải được danh mục ({categoryError}).</span>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setCategoryReloadCount((c) => c + 1)}
              >
                Thử lại danh mục
              </button>
            </div>
          </div>
        )}

        <div className="menu-layout">
          <CategoryTabs
            items={categories}
            value={categoryId}
            variant="rail"
            onChange={(id) => {
              setCategoryId(id)
              setPage(1)
            }}
          />

          <div className="menu-main">
            <div className="menu-toolbar">
              <label className="search search--with-icon">
                <span className="visually-hidden">Tìm món theo tên hoặc mô tả</span>
                <span className="search__icon" aria-hidden="true">
                  <IconSearch width={18} height={18} />
                </span>
                <input
                  className="search__input"
                  type="search"
                  value={keyword}
                  placeholder="Tìm theo tên hoặc mô tả…"
                  onChange={(event) => handleKeyword(event.target.value)}
                />
                {keyword && (
                  <button
                    type="button"
                    className="search__clear"
                    onClick={clearSearch}
                    aria-label="Xoá từ khoá tìm kiếm"
                  >
                    <IconX width={14} height={14} />
                  </button>
                )}
              </label>

              <label className="field field--inline">
                <span className="field__label-inline">Mức giá:</span>
                <select
                  className="field__control"
                  value={priceRange}
                  aria-label="Lọc theo khoảng giá"
                  onChange={(event) => {
                    setPriceRange(event.target.value)
                    setPage(1)
                  }}
                >
                  {PRICE_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {hasActiveFilters && (
              <div className="filter-chips" aria-label="Điều kiện lọc đang áp dụng">
                <span className="filter-chips__label">Đang lọc theo:</span>
                {activeCategory && (
                  <span className="chip">
                    Nhóm: <strong>{activeCategory.name}</strong>
                    <button
                      type="button"
                      className="chip__remove"
                      onClick={() => {
                        setCategoryId(null)
                        setPage(1)
                      }}
                      aria-label={`Bỏ lọc nhóm ${activeCategory.name}`}
                    >
                      <IconX width={12} height={12} />
                    </button>
                  </span>
                )}
                {priceRange && (
                  <span className="chip">
                    Giá: <strong>{activePriceLabel}</strong>
                    <button
                      type="button"
                      className="chip__remove"
                      onClick={() => {
                        setPriceRange('')
                        setPage(1)
                      }}
                      aria-label="Bỏ lọc khoảng giá"
                    >
                      <IconX width={12} height={12} />
                    </button>
                  </span>
                )}
                {search && (
                  <span className="chip">
                    Từ khoá: <strong>&ldquo;{search}&rdquo;</strong>
                    <button
                      type="button"
                      className="chip__remove"
                      onClick={clearSearch}
                      aria-label="Bỏ từ khoá tìm kiếm"
                    >
                      <IconX width={12} height={12} />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm filter-chips__reset"
                  onClick={resetFilters}
                >
                  Xoá tất cả lọc
                </button>
              </div>
            )}

            {error && (
              <div className="notice notice--error" role="alert">
                <div className="notice__content">
                  <span>{error}</span>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => setProductReloadCount((c) => c + 1)}
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            )}

            {loading && <Loading label="Đang tải món" />}

            {!loading && !error && result.items.length === 0 && (
              <EmptyState
                title="Không có món nào khớp"
                text="Thử bỏ bớt điều kiện lọc hoặc tìm bằng tên khác — ví dụ “phin”, “trà sen”."
                action={
                  <button type="button" className="btn btn--outline" onClick={resetFilters}>
                    Xoá điều kiện lọc
                  </button>
                }
              />
            )}

            {!loading && !error && result.items.length > 0 && (
              <div className="menu-grid">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={handleAdd} disabled={mutating} />
                ))}
              </div>
            )}

            {!loading && !error && result.total_pages > 1 && (
              <nav className="pagination" aria-label="Phân trang thực đơn">
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
          </div>
        </div>
      </div>
    </section>
  )
}

import { useCallback, useMemo, useRef, useState } from 'react'
import { categories as categoriesApi, products as productsApi } from '../api'
import { CategoryTabs, EmptyState, Loading, ProductCard } from '../components'
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
  const { add } = useCart()
  const [categoryId, setCategoryId] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [page, setPage] = useState(1)

  const priceQuery = useMemo(() => {
    if (priceRange === 'under-35') return { max_price: 34999 }
    if (priceRange === '35-50') return { min_price: 35000, max_price: 50000 }
    if (priceRange === 'over-50') return { min_price: 50001 }
    return {}
  }, [priceRange])

  const searchTimer = useRef(null)

  const handleKeyword = (value) => {
    setKeyword(value)
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      setSearch(value.trim())
      setPage(1)
    }, 300)
  }

  const categoryLoader = useCallback(() => categoriesApi.list(), [])
  const { data: categories } = useAsyncData(categoryLoader, 'categories')

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

  const key = JSON.stringify([search, categoryId, priceRange, page])
  const { data, error, loading } = useAsyncData(productLoader, key)
  const result = data ?? EMPTY_RESULT

  const handleAdd = async (product) => {
    await add(product, 1)
  }

  const resetFilters = () => {
    setKeyword('')
    setSearch('')
    setPriceRange('')
    setCategoryId(null)
    setPage(1)
  }
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h1 className="section-head__title">Thực đơn</h1>
          <p className="menu-result">{loading ? 'Đang tìm…' : `${result.total} món phù hợp`}</p>
        </div>

        <div className="menu-toolbar">
          <label className="search">
            <span className="visually-hidden">Tìm món</span>
            <input
              className="search__input"
              type="search"
              value={keyword}
              placeholder="Tìm theo tên hoặc mô tả…"
              onChange={(event) => handleKeyword(event.target.value)}
            />
          </label>
          <label className="field field--inline">
            <span className="visually-hidden">Lọc theo giá</span>
            <select
              className="field__control"
              value={priceRange}
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

        <CategoryTabs
          items={categories ?? []}
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id)
            setPage(1)
          }}
        />

        {error && <p className="notice notice--error">{error}</p>}
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

        {!loading && result.items.length > 0 && (
          <div className="menu-grid">
            {result.items.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={handleAdd} />
            ))}
          </div>
        )}

        {result.total_pages > 1 && (
          <nav className="pagination" aria-label="Phân trang">
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
    </section>
  )
}

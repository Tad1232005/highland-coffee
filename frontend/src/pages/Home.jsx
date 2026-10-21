import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { categories as categoriesApi, products as productsApi } from '../api'
import { CategoryTabs, EmptyState, Loading, PhinDrip, ProductCard } from '../components'
import { useCart } from '../context/useCart'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatPrice } from '../utils/format'

export function Home() {
  const { add } = useCart()
  const [activeCategory, setActiveCategory] = useState(null)

  const loader = useCallback(async () => {
    const [categoryList, productList] = await Promise.all([
      categoriesApi.list(),
      productsApi.list({ page: 1, size: 100 }),
    ])
    return { categories: categoryList, products: productList.items }
  }, [])

  const { data, error, loading } = useAsyncData(loader, 'home')
  const categories = useMemo(() => data?.categories ?? [], [data])
  const all = useMemo(() => data?.products ?? [], [data])

  const featured = useMemo(() => {
    const filtered = activeCategory
      ? all.filter((product) => product.category_id === activeCategory)
      : all
    return filtered.slice(0, 8)
  }, [all, activeCategory])

  const heroProduct = useMemo(
    () => all.find((product) => product.slug === 'phin-sua-da') ?? null,
    [all],
  )

  const handleAdd = async (product) => {
    await add(product, 1)
  }

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <h1 className="hero__title">Pha phin đúng cách, từ 2013.</h1>
            <p className="hero__lead">
              Cà phê Robusta Đắk Lắk chiết qua phin truyền thống, hòa sữa đặc và đá. Ly đầu tiên
              mỗi sáng của quán luôn là ly này.
            </p>
            <div className="hero__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => heroProduct && handleAdd(heroProduct)}
                disabled={!heroProduct}
              >
                Thêm Phin Sữa Đá vào giỏ
              </button>
              <Link to="/menu" className="btn btn--on-dark">
                Xem toàn bộ thực đơn
              </Link>
            </div>
            {heroProduct && (
              <p className="hero__note">
                <strong>{formatPrice(heroProduct.price)}</strong> · Ly vừa, sữa dày, đá vừa phải
              </p>
            )}
          </div>
          <div className="hero__figure">
            <PhinDrip />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-head__title">Món đang được gọi</h2>
            <Link to="/menu" className="section-head__link">
              Xem đủ {all.length} món
            </Link>
          </div>

          <CategoryTabs
            items={categories}
            value={activeCategory}
            onChange={setActiveCategory}
            allLabel="Tất cả"
          />

          {error && <p className="notice notice--error">{error}</p>}
          {loading && <Loading label="Đang tải thực đơn" />}

          {!loading && !error && featured.length === 0 && (
            <EmptyState
              title="Nhóm này đang trống"
              text="Quán đang chuẩn bị món mới. Quay lại sau ít phút hoặc xem nhóm khác."
              action={
                <Link to="/menu" className="btn btn--outline">
                  Xem thực đơn
                </Link>
              }
            />
          )}

          {!loading && featured.length > 0 && (
            <div className="menu-grid">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={handleAdd} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

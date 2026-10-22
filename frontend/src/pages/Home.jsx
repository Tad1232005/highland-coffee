import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { categories as categoriesApi, products as productsApi } from '../api'
import { CategoryTabs, EmptyState, Loading, PhinDrip, PhotoBackdrop, ProductCard, Reveal } from '../components'
import { IconClock, IconCup, IconSpark } from '../components/icons'
import { useCart } from '../context/useCart'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatPrice } from '../utils/format'

const STEPS = [
  {
    title: 'Chuẩn bị',
    text: 'Sữa đặc ở đáy ly, phin rửa sạch, cà phê xay vừa phải.',
  },
  {
    title: 'Rót nước',
    text: 'Nước 95°C rót nhẹ vào phin, đậy nắp giữ nhiệt hai phút.',
  },
  {
    title: 'Nhỏ giọt',
    text: 'Nắn nhẹ nắp phin, để cà phê rơi từng giọt xuống sữa.',
  },
  {
    title: 'Thưởng thức',
    text: 'Khuấy nhẹ, thêm đá và uống khi còn ấm.',
  },
]

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
          <div className="section-head section-head--tight">
            <div>
              <h2 className="section-head__title">Món đang được gọi</h2>
              <p className="section-head__lead">
                Ly phin, trà tuyệt hảo và bánh ngọt làm mới mỗi ngày.
              </p>
            </div>
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

      <section className="statement">
        <div className="container statement__inner">
          <div>
            <span className="statement__rule" aria-hidden="true" />
            <Reveal as="h2" variant="wipe" className="statement__title">
              Ba phút cho một ly đậm
            </Reveal>
          </div>

          <div>
            <p className="statement__text">
              Nước 95 độ rót nhẹ vào phin, giọt cà phê rơi từng giọt, sữa đặc quyện đều. Không có cách
              nào làm nhanh hơn mà vẫn ngon.
            </p>

            <dl className="statement__facts">
              <Reveal as="div" delay={80} className="statement__fact">
                <dt>95°C</dt>
                <dd>Nhiệt độ nước để cà phê ra vị, không chát</dd>
              </Reveal>
              <Reveal as="div" delay={160} className="statement__fact">
                <dt>3 phút</dt>
                <dd>Thời gian để giọt cà phê ngấm hết trong phin</dd>
              </Reveal>
              <Reveal as="div" delay={240} className="statement__fact">
                <dt>100%</dt>
                <dd>Robusta Đắk Lắk, rang mộc từng lô nhỏ</dd>
              </Reveal>
            </dl>
          </div>
        </div>
      </section>

      <section className="section photo-band">
        <PhotoBackdrop />
        <div className="photo-band__scrim" aria-hidden="true" />

        <div className="container">
          <div className="section-head section-head--on-dark">
            <div>
              <h2 className="section-head__title">Về Highlands</h2>
              <p className="section-head__lead">
                Một ly phin đúng cách bắt đầu từ hạt cà phê và kỹ thuật pha.
              </p>
            </div>
          </div>

          <ul className="feature-grid">
            <li className="feature">
              <span className="feature__icon">
                <IconCup width={20} height={20} />
              </span>
              <div>
                <h3 className="feature__title">Cà phê tuyển chọn</h3>
                <p className="feature__text">
                  Robusta Đắk Lắk đạt chuẩn, rang mộc mỗi đợt để giữ trọn vị đất và hậu vị ngọt.
                </p>
              </div>
            </li>
            <li className="feature">
              <span className="feature__icon">
                <IconSpark width={20} height={20} />
              </span>
              <div>
                <h3 className="feature__title">Pha phin truyền thống</h3>
                <p className="feature__text">
                  Chính phin, giọt chậm, sữa đá để thành đúng độ đậm như quán truyền thống.
                </p>
              </div>
            </li>
            <li className="feature">
              <span className="feature__icon">
                <IconClock width={20} height={20} />
              </span>
              <div>
                <h3 className="feature__title">Giao nhanh trong giờ</h3>
                <p className="feature__text">
                  Đặt món trên web, quán gọi xác nhận và chuyển món tận nơi chỉ trong 30 phút.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section className="process">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-head__title">Cách pha phin tại nhà</h2>
              <p className="section-head__lead">
                Bốn bước với đúng dụng cụ bạn đã có trong bếp.
              </p>
            </div>
          </div>

          <ol className="process__grid">
            {STEPS.map((step, index) => (
              <Reveal as="li" key={step.title} variant="line" delay={index * 90} className="process__step">
                <span className="process__num">0{index + 1}</span>
                <h3 className="process__title">{step.title}</h3>
                <p className="process__text">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}

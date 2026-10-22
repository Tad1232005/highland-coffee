import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { products as productsApi } from '../api'
import { EmptyState, Loading, ProductCard, QuantityStepper } from '../components'
import { useCart } from '../context/useCart'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatPrice } from '../utils/format'

export function ProductDetail() {
  const { id } = useParams()
  const { add } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const loader = useCallback(async () => {
    const product = await productsApi.get(id)
    const list = await productsApi.list({ category_id: product.category_id, size: 100 })
    return {
      product,
      related: list.items.filter((item) => item.id !== product.id).slice(0, 3),
    }
  }, [id])

  const { data, error, loading } = useAsyncData(loader, `product-${id}`)
  const product = data?.product ?? null
  const related = data?.related ?? []

  const handleAdd = async () => {
    if (!product) return
    await add(product, quantity)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <Loading label="Đang tải món" />
        </div>
      </section>
    )
  }

  if (error || !product) {
    return (
      <section className="section">
        <div className="container">
          <EmptyState
            title="Món này không còn trên thực đơn"
            text="Có thể quán vừa ngừng bán. Xem thực đơn để chọn món khác nhé."
            action={
              <Link to="/menu" className="btn btn--primary">
                Xem thực đơn
              </Link>
            }
          />
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <nav className="breadcrumb" aria-label="Đường dẫn">
          <Link to="/">Trang chủ</Link>
          <span aria-hidden="true">/</span>
          <Link to="/menu">Thực đơn</Link>
          <span aria-hidden="true">/</span>
          <span>{product.name}</span>
        </nav>

        <div className="detail">
          <div className="detail__media">
            <img src={product.image_url} alt={product.name} width="800" height="600" />
          </div>

          <div className="detail__body">
            {product.category && <p className="detail__category">{product.category.name}</p>}
            <h1 className="detail__title">{product.name}</h1>
            <p className="detail__desc">{product.description}</p>

            <div className="detail__buy-box">
              <p className="price price--lg">{formatPrice(product.price)}</p>

              <div className="detail__buy">
                <QuantityStepper value={quantity} onChange={setQuantity} />
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleAdd}
                  disabled={added}
                >
                  {added
                    ? 'Đã thêm vào giỏ'
                    : `Thêm vào giỏ · ${formatPrice(product.price * quantity)}`}
                </button>
              </div>

              <p className="detail__note">
                Pha tại quán bằng phin truyền thống. Giao trong 30 phút trong nội thành.
              </p>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="detail__related">
            <div className="section-head">
              <h2 className="section-head__title">Món cùng nhóm</h2>
            </div>
            <div className="menu-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} onAdd={(p) => add(p, 1)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

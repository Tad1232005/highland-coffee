import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { products as productsApi } from '../api'
import { EmptyState, Loading, ProductCard, QuantityStepper } from '../components'
import { IconCup } from '../components/icons'
import { useCart } from '../context/useCart'
import { useToast } from '../context/useToast'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatPrice } from '../utils/format'

export function ProductDetail() {
  const { id } = useParams()
  return <ProductDetailContent key={id} id={id} />
}

function ProductDetailContent({ id }) {
  const { add, mutating } = useCart()
  const { notify } = useToast()

  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)

  const timerRef = useRef(null)
  const pendingRef = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [id])


  const loader = useCallback(async () => {
    const product = await productsApi.get(id)
    let related = []
    try {
      if (product?.category_id) {
        const list = await productsApi.list({ category_id: product.category_id, size: 100 })
        related = list.items.filter((item) => item.id !== product.id).slice(0, 3)
      }
    } catch {
      // Related products failure does not block the main product view
    }
    return { product, related }
  }, [id])

  const { data, error, errorStatus, loading } = useAsyncData(loader, `product-${id}-${reloadCount}`)
  const product = data?.product ?? null
  const related = data?.related ?? []

  const isAvailable = product ? product.is_available !== false : false

  const handleAdd = async () => {
    if (!product || !isAvailable || pendingRef.current || mutating) return
    pendingRef.current = true
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setBusy(true)
    try {
      await add(product, quantity)
      if (!mounted.current) return
      setAdded(true)
      timerRef.current = window.setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      if (err?.message !== 'unauthorized' && !err?.notified) notify(err.detail ?? err.message ?? 'Không thể thêm món vào giỏ.', { type: 'error' })
    } finally {
      setBusy(false)
      pendingRef.current = false
    }
  }

  if (loading) {
    return (
      <section className="section product-detail-page">
        <div className="container">
          <Loading label="Đang tải món" />
        </div>
      </section>
    )
  }

  const isNotFound = !product && (errorStatus === 404 || !error)

  if (isNotFound) {
    return (
      <section className="section product-detail-page">
        <div className="container">
          <EmptyState
            title="Món này không còn trên thực đơn"
            text="Có thể quán vừa ngừng bán hoặc đường dẫn không đúng. Xem thực đơn để chọn món khác nhé."
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

  if (error && !product) {
    return (
      <section className="section product-detail-page">
        <div className="container">
          <div className="notice notice--error" role="alert">
            <div className="notice__content">
              <span>Không tải được thông tin món ({error}). Vui lòng thử lại.</span>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setReloadCount((c) => c + 1)}
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section product-detail-page">
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
            {imgFailed || !product.image_url ? (
              <div className="detail__placeholder" aria-label={product.name}>
                <IconCup width={48} height={48} />
                <span>{product.name}</span>
              </div>
            ) : (
              <img
                src={product.image_url}
                alt={product.name}
                width="800"
                height="600"
                onError={() => setImgFailed(true)}
              />
            )}
            {!isAvailable && <span className="detail__badge">Tạm ngừng bán</span>}
          </div>

          <div className="detail__body">
            {product.category && <p className="detail__category">{product.category.name}</p>}
            <h1 className="detail__title">{product.name}</h1>
            <p className="detail__desc">{product.description}</p>

            {!isAvailable && (
              <div className="notice notice--error" role="status">
                <span>Món này hiện đang tạm ngừng bán. Quán rất tiếc vì sự bất tiện này.</span>
              </div>
            )}

            <div className="detail__buy-box">
              <div className="detail__calc">
                <div className="detail__calc-row">
                  <span className="detail__calc-label">Đơn giá:</span>
                  <span className="price">{formatPrice(product.price)}</span>
                </div>

                <div className="detail__calc-row">
                  <span className="detail__calc-label">Số lượng:</span>
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    disabled={!isAvailable || busy || mutating}
                  />
                </div>

                <div className="detail__calc-row detail__calc-row--total">
                  <span className="detail__calc-label">Thành tiền:</span>
                  <strong className="price price--lg">
                    {formatPrice(product.price * quantity)}
                  </strong>
                </div>
              </div>

              <div className="detail__actions">
                <button
                  type="button"
                  className={`btn btn--primary btn--lg${added ? ' is-done' : ''}`}
                  onClick={handleAdd}
                  disabled={!isAvailable || busy || mutating}
                >
                  {added
                    ? 'Đã thêm vào giỏ'
                    : busy
                      ? 'Đang thêm…'
                      : !isAvailable
                        ? 'Tạm ngừng bán'
                        : `Thêm vào giỏ · ${formatPrice(product.price * quantity)}`}
                </button>
              </div>

              <p className="detail__note">
                Kiểm tra số lượng trước khi thêm. Bạn có thể ghi chú cho quán khi đặt hàng.
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
                <ProductCard key={item.id} product={item} onAdd={(p) => add(p, 1)} disabled={mutating} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky buy bar */}
      <div className="detail__mobile-bar" role="region" aria-label="Thanh đặt món nhanh">
        <div className="detail__mobile-bar-inner">
          <div className="detail__mobile-bar-info">
            <span className="detail__mobile-bar-label">Thành tiền ({quantity} ly)</span>
            <strong className="detail__mobile-bar-price">
              {formatPrice(product.price * quantity)}
            </strong>
          </div>
          <button
            type="button"
            className={`btn btn--primary btn--sm${added ? ' is-done' : ''}`}
            onClick={handleAdd}
            disabled={!isAvailable || busy || mutating}
          >
            {added
              ? 'Đã thêm'
              : busy
                ? 'Đang thêm…'
                : !isAvailable
                  ? 'Tạm ngừng bán'
                  : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>
    </section>
  )
}

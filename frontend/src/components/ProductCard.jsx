import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/format'
import { IconCup, IconPlus } from './icons'
import { useToast } from '../context/useToast'

export function ProductCard({ product, onAdd, disabled = false }) {
  const [state, setState] = useState('idle')
  const [imgFailed, setImgFailed] = useState(false)
  const timerRef = useRef(null)
  const pending = useRef(false)
  const mounted = useRef(false)
  const { notify } = useToast()

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const isAvailable = product.is_available !== false

  const handleAdd = async () => {
    if (pending.current || !isAvailable || disabled) return
    pending.current = true
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setState('busy')
    try {
      await onAdd(product)
      if (!mounted.current) return
      setState('done')
      timerRef.current = window.setTimeout(() => setState('idle'), 1600)
    } catch (error) {
      if (error.message !== 'unauthorized' && !error.notified) notify(error.detail ?? error.message ?? 'Không thêm được món.', { type: 'error' })
      if (mounted.current) setState('idle')
    } finally {
      pending.current = false
    }
  }

  return (
    <article className={`product-card${!isAvailable ? ' is-unavailable' : ''}`}>
      <Link className="product-card__media" to={`/products/${product.id}`}>
        {imgFailed || !product.image_url ? (
          <div className="product-card__placeholder" aria-label={product.name}>
            <IconCup width={36} height={36} />
            <span>{product.name}</span>
          </div>
        ) : (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            width="600"
            height="450"
            onError={() => setImgFailed(true)}
          />
        )}
        {!isAvailable && <span className="product-card__badge">Tạm ngừng bán</span>}
      </Link>
      <div className="product-card__body">
        <h3 className="product-card__name">
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-card__desc">{product.description}</p>
        <div className="product-card__foot">
          <span className="price">{formatPrice(product.price)}</span>
          <button
            type="button"
            className={`btn btn--sm product-card__add${state === 'done' ? ' is-done' : ''}`}
            onClick={handleAdd}
            disabled={!isAvailable || state === 'busy' || disabled}
            aria-label={
              !isAvailable
                ? `${product.name} tạm ngừng bán`
                : state === 'busy'
                  ? `Đang thêm ${product.name}`
                  : state === 'done'
                    ? `Đã thêm ${product.name}`
                    : `Thêm ${product.name} vào giỏ`
            }
          >
            {state === 'done' ? (
              <svg
                className="product-card__check"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M4 12.5 9.5 18 20 6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : !isAvailable ? null : (
              <IconPlus className="product-card__plus" width={14} height={14} />
            )}
            {!isAvailable
              ? 'Tạm ngừng bán'
              : state === 'done'
                ? 'Đã thêm'
                : state === 'busy'
                  ? 'Đang thêm'
                  : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>
    </article>
  )
}

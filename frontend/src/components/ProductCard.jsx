import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/format'
import { IconPlus } from './icons'

export function ProductCard({ product, onAdd }) {
  const [state, setState] = useState('idle')

  const handleAdd = async () => {
    setState('busy')
    try {
      await onAdd(product)
      setState('done')
      window.setTimeout(() => setState('idle'), 1600)
    } catch {
      setState('idle')
    }
  }

  return (
    <article className="product-card">
      <Link className="product-card__media" to={`/products/${product.id}`}>
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          width="600"
          height="450"
        />
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
            disabled={state === 'busy'}
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
            ) : (
              <IconPlus className="product-card__plus" width={14} height={14} />
            )}
            {state === 'done' ? 'Đã thêm' : state === 'busy' ? 'Đang thêm' : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>
    </article>
  )
}

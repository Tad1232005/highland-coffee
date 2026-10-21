import { orderStatusLabels } from '../content/orders'

export function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{orderStatusLabels[status] ?? status}</span>
}

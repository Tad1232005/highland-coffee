export function Loading({ label = 'Đang tải' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="visually-hidden">{label}…</span>
      <div className="loading__row" aria-hidden="true">
        <span className="loading__card">
          <span className="loading__block loading__block--media" />
          <span className="loading__block" />
          <span className="loading__block loading__block--short" />
        </span>
        <span className="loading__card">
          <span className="loading__block loading__block--media" />
          <span className="loading__block" />
          <span className="loading__block loading__block--short" />
        </span>
        <span className="loading__card">
          <span className="loading__block loading__block--media" />
          <span className="loading__block" />
          <span className="loading__block loading__block--short" />
        </span>
      </div>
    </div>
  )
}

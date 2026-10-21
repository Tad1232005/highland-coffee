export function Loading({ label = 'Đang tải' }) {
  return (
    <p className="loading-note" role="status">
      {label}…
    </p>
  )
}

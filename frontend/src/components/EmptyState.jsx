export function EmptyState({ title, text, action, children }) {
  return (
    <div className="empty">
      <h2 className="empty__title">{title}</h2>
      {text && <p className="empty__text">{text}</p>}
      {action}
      {children}
    </div>
  )
}

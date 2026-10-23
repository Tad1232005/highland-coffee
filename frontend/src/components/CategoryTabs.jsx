/** Bộ lọc danh mục dùng button: Tab để di chuyển, Enter/Space để chọn. */
export function CategoryTabs({
  items,
  value,
  onChange,
  allLabel = 'Tất cả',
  variant = 'inline',
}) {
  const choices = [{ id: null, name: allLabel }, ...items]
  return (
    <div className={`tabs tabs--${variant}`} role="group" aria-label="Nhóm món">
      {choices.map((item) => (
        <button
          key={item.id ?? 'all'}
          type="button"
          aria-pressed={value === item.id}
          className={`tab${value === item.id ? ' is-active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.name}
        </button>
      ))}
    </div>
  )
}

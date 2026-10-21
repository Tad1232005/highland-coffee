export function CategoryTabs({ items, value, onChange, allLabel = 'Tất cả' }) {
  return (
    <div className="tabs" role="tablist" aria-label="Nhóm món">
      <button
        type="button"
        role="tab"
        aria-selected={value === null}
        className={`tab${value === null ? ' is-active' : ''}`}
        onClick={() => onChange(null)}
      >
        {allLabel}
      </button>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`tab${value === item.id ? ' is-active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.name}
        </button>
      ))}
    </div>
  )
}

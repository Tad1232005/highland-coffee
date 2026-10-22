/**
 * Danh mục món: bản ngang (mặc định) hoặc cột dọc (rail) cho trang thực đơn.
 * - `inline`: chữ + gạch chân đỏ ở mục đang chọn.
 * - `rail`: cột dọc bên trái, mục đang chọn có gạch dọc đỏ.
 */
export function CategoryTabs({
  items,
  value,
  onChange,
  allLabel = 'Tất cả',
  variant = 'inline',
}) {
  return (
    <div className={`tabs tabs--${variant}`} role="tablist" aria-label="Nhóm món">
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

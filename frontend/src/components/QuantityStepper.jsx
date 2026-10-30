import { IconMinus, IconPlus } from './icons'

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  label = 'Số lượng',
}) {
  return (
    <div className={`stepper${disabled ? ' is-disabled' : ''}`} role="group" aria-label={label}>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label="Bớt một"
      >
        <IconMinus width={16} height={16} />
      </button>
      <span key={value} className="stepper__value">
        {value}
      </span>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Thêm một"
      >
        <IconPlus width={16} height={16} />
      </button>
    </div>
  )
}

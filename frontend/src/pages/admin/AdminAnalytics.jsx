import { useCallback, useState } from 'react'
import { admin as adminApi } from '../../api'
import { Loading } from '../../components'
import { useAsyncData } from '../../hooks/useAsyncData'
import { formatPrice } from '../../utils/format'

const PERIODS = [7, 30]

function formatLocalIsoDate(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${fields.year}-${fields.month}-${fields.day}`
}

function shiftIsoDate(value, offset) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10)
}

function daysBetween(start, end) {
  return Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1
}

function formatRangeDate(value) {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function formatChartDate(value, days) {
  const date = new Date(`${value}T12:00:00`)
  if (days === 7) {
    return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: 'numeric' }).format(date)
  }
  return date.getDate() === 1
    ? `${date.getDate()}/${date.getMonth() + 1}`
    : String(date.getDate())
}

function formatChartValue(value) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`
  }
  if (value >= 1_000) return `${Math.round(value / 1_000).toLocaleString('vi-VN')}k`
  return String(value)
}

export function AdminAnalytics() {
  const [days, setDays] = useState(7)
  const today = formatLocalIsoDate(new Date())
  const [customStart, setCustomStart] = useState(() => shiftIsoDate(today, -6))
  const [customEnd, setCustomEnd] = useState(today)
  const [selectedRange, setSelectedRange] = useState(null)
  const [rangeError, setRangeError] = useState('')
  const loader = useCallback(
    () => adminApi.getRevenue(selectedRange ?? { days }),
    [days, selectedRange],
  )
  const rangeKey = selectedRange
    ? `admin-revenue-${selectedRange.start_date}-${selectedRange.end_date}`
    : `admin-revenue-${days}`
  const { data, error: loadError, loading } = useAsyncData(loader, rangeKey)
  const error = rangeError || loadError
  const items = data?.items ?? []
  const rangeDays =
    data?.days ??
    (selectedRange ? daysBetween(selectedRange.start_date, selectedRange.end_date) : days)
  const maxRevenue = Math.max(1, ...items.map((item) => item.revenue))
  const summary = data?.summary ?? {
    revenue: items.reduce((total, item) => total + item.revenue, 0),
    completed_orders: 0,
    average_order_value: 0,
    previous_revenue: 0,
    previous_completed_orders: 0,
    revenue_change_percent: null,
  }
  const comparison = summary.revenue_change_percent
  const comparisonClass =
    comparison === null
      ? 'admin-analytics__change'
      : `admin-analytics__change admin-analytics__change--${comparison >= 0 ? 'up' : 'down'}`
  const rangeDescription = data
    ? `${formatRangeDate(data.start_date)} – ${formatRangeDate(data.end_date)}`
    : ''
  const chartStyle = {
    gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
    ...(rangeDays > 14 ? { minWidth: `${Math.max(46, items.length * 1.7)}rem` } : {}),
  }
  const chartLabel = `Biểu đồ doanh thu ${rangeDays} ngày: ${items
    .map((item) => `${item.date} ${formatPrice(item.revenue)}`)
    .join(', ')}`

  const applyCustomRange = (event) => {
    event.preventDefault()
    if (!customStart || !customEnd || customStart > customEnd || customEnd > today) {
      setRangeError('Chọn khoảng ngày hợp lệ, không vượt quá hôm nay.')
      return
    }
    if (daysBetween(customStart, customEnd) > 366) {
      setRangeError('Khoảng ngày tối đa là 366 ngày.')
      return
    }
    setRangeError('')
    setSelectedRange({ start_date: customStart, end_date: customEnd })
  }

  const selectPeriod = (period) => {
    setDays(period)
    setSelectedRange(null)
    setRangeError('')
    setCustomStart(shiftIsoDate(today, -(period - 1)))
    setCustomEnd(today)
  }

  return (
    <section className="admin__panel admin-analytics">
      <header className="admin__panel-head">
        <div>
          <h1 className="admin__panel-title">Phân tích doanh thu</h1>
          <p className="admin__panel-sub">
            Doanh thu theo ngày hoàn tất đơn{rangeDescription ? ` · ${rangeDescription}` : ''}.
          </p>
        </div>
        <div className="admin__filters" role="group" aria-label="Khoảng thời gian">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              className={`chip${!selectedRange && days === period ? ' is-active' : ''}`}
              aria-pressed={!selectedRange && days === period}
              onClick={() => selectPeriod(period)}
            >
              {period} ngày
            </button>
          ))}
        </div>
      </header>

      <form className="admin-analytics__range-form" onSubmit={applyCustomRange} noValidate>
        <div className="admin-analytics__range-field">
          <label className="field__label" htmlFor="revenue-start-date">Từ ngày</label>
          <input
            id="revenue-start-date"
            className="field__control field__control--sm"
            type="date"
            value={customStart}
            max={today}
            onChange={(event) => {
              setCustomStart(event.target.value)
              setRangeError('')
            }}
            aria-required="true"
          />
        </div>
        <div className="admin-analytics__range-field">
          <label className="field__label" htmlFor="revenue-end-date">Đến ngày</label>
          <input
            id="revenue-end-date"
            className="field__control field__control--sm"
            type="date"
            value={customEnd}
            max={today}
            onChange={(event) => {
              setCustomEnd(event.target.value)
              setRangeError('')
            }}
            aria-required="true"
          />
        </div>
        <button className="btn btn--outline btn--sm" type="submit">Áp dụng</button>
      </form>

      {error && <p className="notice notice--error" role="alert">{error}</p>}
      {loading && <Loading label="Đang tải doanh thu" />}

      {!loading && data && (
        <>
          <div
            className="admin-metrics admin-metrics--analytics"
            role="group"
            aria-label="Chỉ số doanh thu"
          >
            <article className="admin-metric admin-metric--lead">
              <div className="admin-metric__head">
                <span className="admin-metric__label">Tổng doanh thu · {rangeDays} ngày</span>
                <span className={comparisonClass}>
                  {comparison === null
                    ? 'Chưa so sánh'
                    : `${comparison > 0 ? '+' : ''}${comparison.toLocaleString('vi-VN')}%`}
                </span>
              </div>
              <strong className="admin-metric__value">{formatPrice(summary.revenue)}</strong>
              <span className="admin-metric__hint">
                Kỳ trước: {formatPrice(summary.previous_revenue)}
                {comparison !== null && ` · so với ${rangeDays} ngày trước`}
              </span>
            </article>
            <article className="admin-metric">
              <span className="admin-metric__label">Đơn hoàn tất</span>
              <strong className="admin-metric__value">{summary.completed_orders}</strong>
              <span className="admin-metric__hint">
                Kỳ trước: {summary.previous_completed_orders} đơn
              </span>
            </article>
            <article className="admin-metric">
              <span className="admin-metric__label">Trung bình / đơn</span>
              <strong className="admin-metric__value">
                {formatPrice(summary.average_order_value)}
              </strong>
              <span className="admin-metric__hint">Mỗi đơn hoàn tất</span>
            </article>
            <article className="admin-metric">
              <span className="admin-metric__label">Trung bình / ngày</span>
              <strong className="admin-metric__value">
                {formatPrice(Math.round(summary.revenue / rangeDays))}
              </strong>
              <span className="admin-metric__hint">Tính trên {rangeDays} ngày</span>
            </article>
          </div>

          <section className="admin-dashboard__section" aria-labelledby="admin-revenue-chart-title">
            <div className="admin-dashboard__section-head">
              <div>
                <h2 className="admin__form-title" id="admin-revenue-chart-title">Doanh thu theo ngày</h2>
                <p className="admin__panel-sub">Đơn bị huỷ và đơn chưa hoàn tất không được tính.</p>
              </div>
            </div>
            <div className="admin-chart" role="img" aria-label={chartLabel}>
              <div
                className={`admin-chart__plot${rangeDays > 14 ? ' admin-chart__plot--wide' : ''}`}
                style={chartStyle}
              >
                {items.map((item) => {
                  const height = item.revenue ? Math.max(6, (item.revenue / maxRevenue) * 100) : 0
                  return (
                    <div
                      className="admin-chart__column"
                      key={item.date}
                      title={`${item.date}: ${formatPrice(item.revenue)}`}
                    >
                      <strong className="admin-chart__value">
                        {formatChartValue(item.revenue)}
                      </strong>
                      <div className="admin-chart__track">
                        <span className="admin-chart__bar" style={{ height: `${height}%` }} />
                      </div>
                      <span className="admin-chart__label">
                        {formatChartDate(item.date, rangeDays)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </>
      )}
    </section>
  )
}

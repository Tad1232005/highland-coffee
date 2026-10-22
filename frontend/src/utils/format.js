/** Định dạng tiền VND, ngày giờ theo chuẩn Việt Nam. */

const currency = new Intl.NumberFormat('vi-VN')

export function formatPrice(value) {
  return `${currency.format(Number(value ?? 0))} đ`
}

export function formatNumber(value) {
  return currency.format(Number(value ?? 0))
}

export function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

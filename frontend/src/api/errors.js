/** Lỗi chuẩn hoá cho cả hai adapter (mock và HTTP) để giao diện xử lý giống nhau. */
export class ApiError extends Error {
  constructor(status, detail) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export function toApiError(error) {
  if (error instanceof ApiError) return error
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return new ApiError(error.response.status, detail)
  if (Array.isArray(detail) && detail.length > 0) {
    return new ApiError(error.response.status, detail[0]?.msg ?? 'Dữ liệu không hợp lệ.')
  }
  return new ApiError(error?.response?.status ?? 500, 'Không kết nối được máy chủ. Thử lại sau.')
}

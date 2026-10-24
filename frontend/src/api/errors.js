/** Lỗi chuẩn hoá cho cả hai adapter (mock và HTTP) để giao diện xử lý giống nhau. */
export class ApiError extends Error {
  constructor(status, detail, fieldErrors = {}) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.fieldErrors = fieldErrors
  }
}

export function toApiError(error) {
  if (error instanceof ApiError) return error
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return new ApiError(error.response.status, detail)
  if (Array.isArray(detail) && detail.length > 0) {
    const fieldErrors = Object.fromEntries(detail
      .filter((item) => item.loc?.[0] === 'body' && typeof item.loc[1] === 'string')
      .map((item) => [item.loc[1], item.msg ?? 'Dữ liệu không hợp lệ.']))
    return new ApiError(error.response.status, detail[0]?.msg ?? 'Dữ liệu không hợp lệ.', fieldErrors)
  }
  return new ApiError(error?.response?.status ?? 500, 'Không kết nối được máy chủ. Thử lại sau.')
}

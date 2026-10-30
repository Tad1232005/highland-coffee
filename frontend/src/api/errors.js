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

/**
 * Backend trả `detail` bằng tiếng Anh. Giao diện là tiếng Việt nên dịch lại
 * ngay tại cửa ngõ duy nhất này; chuỗi không khớp được giữ nguyên để không
 * giấu mất thông tin.
 */
const DETAIL_RULES = [
  // Auth
  [/^An account with this email address already exists\.?$/, () => 'Email này đã được dùng để đăng ký.'],
  [/^Incorrect email or password\.?$/, () => 'Email hoặc mật khẩu không đúng.'],
  [/^User account is deactivated\.?$/, () => 'Tài khoản đã bị khoá.'],
  [
    /^Too many failed login attempts\. Please try again in (\d+) seconds\.?$/,
    (_match, seconds) => `Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ${seconds} giây.`,
  ],

  // Token / quyền
  [/^Authentication credentials were not provided\.?$/, () => 'Bạn cần đăng nhập để tiếp tục.'],
  [
    /^Could not validate credentials or token expired\.?$/,
    () => 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  ],
  [
    /^(Token payload is invalid|Invalid user identifier in token)\.?$/,
    () => 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  ],
  [
    /^The account linked to this token no longer exists\.?$/,
    () => 'Tài khoản của phiên đăng nhập không còn tồn tại.',
  ],
  [/^Inactive user account\.?$/, () => 'Tài khoản đã bị khoá.'],
  [
    /^Operation requires administrative privileges\.?$/,
    () => 'Bạn không có quyền quản trị để thực hiện thao tác này.',
  ],

  // Giỏ hàng
  [/^Product with ID \d+ not found\.?$/, () => 'Không tìm thấy món này.'],
  [/^Product '(.+)' is currently unavailable\.?$/, (_match, name) => `Món “${name}” đang tạm ngừng bán.`],
  [
    /^Cart item with ID \d+ not found in your cart\.?$/,
    () => 'Món này không còn trong giỏ hàng. Có thể bạn đã xoá ở thiết bị khác.',
  ],

  // Đơn hàng
  [
    /^Cannot place order: your shopping cart is empty\.?$/,
    () => 'Giỏ hàng đang trống nên chưa thể đặt món.',
  ],
  [/^Product with ID \d+ no longer exists\.?$/, () => 'Một món trong giỏ không còn tồn tại.'],
  [/^Product '(.+)' is out of stock \/ unavailable\.?$/, (_match, name) => `Món “${name}” đang tạm ngừng bán.`],
  [/^Order #(\d+) not found\.?$/, (_match, id) => `Không tìm thấy đơn #${id}.`],
  [/^You are not authorized to view this order\.?$/, () => 'Bạn không có quyền xem đơn này.'],
  [
    /^start_date and end_date must be provided together\.?$/,
    () => 'Cần chọn cả ngày bắt đầu và ngày kết thúc.',
  ],
  [
    /^Date range must be valid and cannot end in the future\.?$/,
    () => 'Khoảng ngày không hợp lệ hoặc vượt quá hôm nay.',
  ],
  [/^Date range cannot exceed 366 days\.?$/, () => 'Khoảng ngày tối đa là 366 ngày.'],
  [/^Invalid status '(.+)'\. Must be one of: .+$/, (_match, status) => `Trạng thái “${status}” không hợp lệ.`],
  [
    /^Cannot transition order status from '(.+)' to '(.+)'\. .+$/,
    (_match, from, to) => `Không thể chuyển đơn từ “${from}” sang “${to}”.`,
  ],

  // Sản phẩm
  [/^Category with ID \d+ does not exist\.?$/, () => 'Danh mục không tồn tại.'],
  [/^Product with slug '(.+)' already exists\.?$/, (_match, slug) => `Slug “${slug}” đã được dùng cho món khác.`],
  [
    /^Product could not be created: .+$/,
    () => 'Không tạo được món: slug đã tồn tại hoặc danh mục vừa bị xoá.',
  ],
  [
    /^Product could not be updated: .+$/,
    () => 'Không cập nhật được món: slug đã tồn tại hoặc danh mục vừa bị xoá.',
  ],
  [/^Hide this product before deleting it permanently\.?$/, () => 'Hãy ẩn món trước khi xoá vĩnh viễn.'],
  [
    /^This product has order history\. .+$/,
    () => 'Món đã có lịch sử đơn nên không thể xoá vĩnh viễn. Hãy ẩn món thay vì xoá.',
  ],
  [
    /^This product is referenced by existing data and cannot be deleted\.?$/,
    () => 'Món đang được dữ liệu khác tham chiếu nên không thể xoá.',
  ],

  // Danh mục
  [/^Category with ID \d+ not found\.?$/, () => 'Không tìm thấy danh mục.'],
  [
    /^Category with this name or slug already exists\.?$/,
    () => 'Tên hoặc slug danh mục đã tồn tại.',
  ],
  [/^Name is already used by another category\.?$/, () => 'Tên này đã được dùng cho danh mục khác.'],
  [/^Slug is already used by another category\.?$/, () => 'Slug này đã được dùng cho danh mục khác.'],
  [
    /^Category '(.+)' still has products\. .+$/,
    (_match, name) => `Danh mục “${name}” còn sản phẩm. Hãy chuyển hoặc xoá sản phẩm trước.`,
  ],

  // Lỗi validate của Pydantic (FastAPI 422)
  [/^value is not a valid email address/i, () => 'Email không hợp lệ.'],
  [/^String should have at least (\d+) character/i, (_match, count) => `Cần ít nhất ${count} ký tự.`],
  [/^String should have at most (\d+) character/i, (_match, count) => `Tối đa ${count} ký tự.`],
  [/^Field required\.?$/i, () => 'Trường này là bắt buộc.'],
  [/^Input should be a valid integer/i, () => 'Phải là số nguyên.'],
  [/^Input should be a valid boolean/i, () => 'Giá trị đúng/sai không hợp lệ.'],
  [
    /Password must contain at least one letter/i,
    () => 'Mật khẩu phải có ít nhất một chữ cái.',
  ],
  [/Password must contain at least one digit/i, () => 'Mật khẩu phải có ít nhất một chữ số.'],
]

export function translateDetail(detail) {
  if (typeof detail !== 'string' || !detail) return detail
  for (const [pattern, replacement] of DETAIL_RULES) {
    const match = detail.match(pattern)
    if (match) return replacement(...match)
  }
  return detail
}

export function toApiError(error) {
  if (error instanceof ApiError) return error
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') {
    return new ApiError(error.response.status, translateDetail(detail))
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const fieldErrors = Object.fromEntries(
      detail
        .filter((item) => item.loc?.[0] === 'body' && typeof item.loc[1] === 'string')
        .map((item) => [item.loc[1], translateDetail(item.msg) || 'Dữ liệu không hợp lệ.']),
    )
    return new ApiError(
      error.response.status,
      translateDetail(detail[0]?.msg) || 'Dữ liệu không hợp lệ.',
      fieldErrors,
    )
  }
  return new ApiError(error?.response?.status ?? 500, 'Không kết nối được máy chủ. Thử lại sau.')
}

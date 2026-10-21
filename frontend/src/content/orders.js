/** Nhãn và luật chuyển trạng thái đơn — dùng chung cho giao diện và dữ liệu giả lập. */

export const orderStatusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang pha',
  completed: 'Hoàn tất',
  cancelled: 'Đã huỷ',
}

/** Thứ tự hợp lệ của một đơn đang chạy. */
export const orderFlow = ['pending', 'confirmed', 'preparing', 'completed']

/** Nước đi hợp lệ từ mỗi trạng thái — giữ đúng luật của backend. */
export const orderTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

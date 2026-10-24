/**
 * Dữ liệu giả lập cho demo giao diện.
 * Nội dung bám sát backend/app/seed.py (4 nhóm, 18 món, giá và ảnh giống hệt)
 * để khi bật VITE_USE_MOCK=false, giao diện không phải sửa lại bất cứ dòng nào.
 */
import { orderTransitions } from '../content/orders'

export { orderTransitions }

export const categories = [
  {
    id: 1,
    name: 'Cà Phê Phin & Espresso',
    slug: 'ca-phe',
    description:
      'Hương vị cà phê truyền thống Việt Nam đậm đà kết hợp cùng phong cách pha chế hiện đại.',
  },
  {
    id: 2,
    name: 'Trà Tuyệt Hảo',
    slug: 'tra',
    description:
      'Các món trà sen vàng, trà thạch đào thanh mát đặc trưng với hạt sen bùi béo và thạch giòn thơm.',
  },
  {
    id: 3,
    name: 'Freeze Đá Xay',
    slug: 'freeze',
    description:
      'Thức uống đá xay mát lạnh, béo ngậy kem tươi hòa quyện thạch giòn sần sật.',
  },
  {
    id: 4,
    name: 'Bánh Ngọt & Bánh Mì',
    slug: 'banh-ngot',
    description:
      'Các loại bánh ngọt Âu, bánh phô mai và bánh mì que giòn rụm kết hợp hoàn hảo cùng đồ uống.',
  },
]

export const products = [
  {
    id: 1,
    category_id: 1,
    name: 'Phin Sữa Đá',
    slug: 'phin-sua-da',
    price: 39000,
    image_url:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    description:
      'Hương vị cà phê Robusta Việt Nam được chiết xuất qua phin truyền thống hòa quyện cùng sữa đặc béo ngậy ngọt ngào.',
    is_available: true,
  },
  {
    id: 2,
    category_id: 1,
    name: 'Phin Đen Đá',
    slug: 'phin-den-da',
    price: 35000,
    image_url:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
    description:
      'Dành cho tín đồ cà phê đích thực say mê vị đắng đậm đà, mùi hương rang xay quyến rũ đánh thức mọi giác quan.',
    is_available: true,
  },
  {
    id: 3,
    category_id: 1,
    name: 'Bạc Xỉu Đá',
    slug: 'bac-xiu-da',
    price: 39000,
    image_url:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80',
    description:
      'Sự kết hợp hoàn hảo giữa sữa tươi thanh dịu, sữa đặc ngọt bùi và một chút điểm xuyết cà phê phin thơm lừng.',
    is_available: true,
  },
  {
    id: 4,
    category_id: 1,
    name: 'Phin Sữa Tươi Bánh Flan',
    slug: 'phin-sua-tuoi-banh-flan',
    price: 49000,
    image_url:
      'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
    description:
      'Tuyệt phẩm mới với bánh flan béo mịn tan chảy trong vị sữa tươi thanh mát và cà phê phin đậm đà.',
    is_available: true,
  },
  {
    id: 5,
    category_id: 1,
    name: 'Caramel Macchiato',
    slug: 'caramel-macchiato',
    price: 59000,
    image_url:
      'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&auto=format&fit=crop&q=80',
    description:
      'Cà phê Espresso chuẩn Ý hòa quyện cùng sữa tươi bọt mịn và sốt caramel thơm lừng ngọt ngào.',
    is_available: true,
  },
  {
    id: 6,
    category_id: 2,
    name: 'Trà Sen Vàng (Củ Năng)',
    slug: 'tra-sen-vang-cu-nang',
    price: 49000,
    image_url:
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    description:
      'Biểu tượng Highlands với cốt trà Ô Long thanh tao, hạt sen hầm bùi bùi, thạch củ năng giòn ngọt và lớp kem sữa béo ngậy.',
    is_available: true,
  },
  {
    id: 7,
    category_id: 2,
    name: 'Trà Thạch Đào',
    slug: 'tra-thach-dao',
    price: 49000,
    image_url:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    description:
      'Vị trà đen đậm đà pha chút chua ngọt của đào, đi kèm từng miếng thạch đào giòn rụm sảng khoái.',
    is_available: true,
  },
  {
    id: 8,
    category_id: 2,
    name: 'Trà Thanh Đào',
    slug: 'tra-thanh-dao',
    price: 49000,
    image_url:
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
    description:
      'Sự kết hợp giữa vị thanh ngọt của trà và quả đào giòn tươi mọng nước xua tan cái nóng oi ả.',
    is_available: true,
  },
  {
    id: 9,
    category_id: 2,
    name: 'Trà Thạch Vải',
    slug: 'tra-thach-vai',
    price: 49000,
    image_url:
      'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80',
    description:
      'Hương thơm nồng nàn của quả vải chín mọng kết hợp trà xanh tinh tế và thạch dai ngọt mát.',
    is_available: true,
  },
  {
    id: 10,
    category_id: 2,
    name: 'Trà Xanh Đậu Đỏ',
    slug: 'tra-xanh-dau-do',
    price: 49000,
    image_url:
      'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
    description:
      'Trà xanh thượng hạng thơm thoang thoảng kết hợp cùng đậu đỏ Nhật Bản bùi béo ngọt dịu.',
    is_available: true,
  },
  {
    id: 11,
    category_id: 3,
    name: 'Freeze Trà Xanh',
    slug: 'freeze-tra-xanh',
    price: 59000,
    image_url:
      'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80',
    description:
      'Bột trà xanh Matcha cao cấp xay cùng đá nhuyễn, thạch trà xanh giòn dai và bông kem tươi béo ngậy bên trên.',
    is_available: true,
  },
  {
    id: 12,
    category_id: 3,
    name: 'Caramel Phin Freeze',
    slug: 'caramel-phin-freeze',
    price: 59000,
    image_url:
      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
    description:
      'Cà phê phin truyền thống xay cùng thạch cà phê giòn, caramel thơm ngọt và lớp kem tươi hấp dẫn.',
    is_available: true,
  },
  {
    id: 13,
    category_id: 3,
    name: 'Classic Phin Freeze',
    slug: 'classic-phin-freeze',
    price: 59000,
    image_url:
      'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
    description:
      'Dành riêng cho fan cà phê yêu thích cảm giác sảng khoái với đá xay mát rượi và vị cà phê đậm đà.',
    is_available: true,
  },
  {
    id: 14,
    category_id: 3,
    name: 'Cookies & Cream Freeze',
    slug: 'cookies-and-cream-freeze',
    price: 59000,
    image_url:
      'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80',
    description:
      'Bánh oreo sô-cô-la xay nhuyễn cùng sữa tươi và kem, ngọt ngào giòn tan trong từng ngụm.',
    is_available: true,
  },
  {
    id: 15,
    category_id: 4,
    name: 'Bánh Mousse Cacao',
    slug: 'banh-mousse-cacao',
    price: 35000,
    image_url:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
    description:
      'Lớp mousse cacao mềm mịn, đậm đà vị sô-cô-la nguyên chất, không quá ngọt, ăn kèm cà phê cực đỉnh.',
    is_available: true,
  },
  {
    id: 16,
    category_id: 4,
    name: 'Bánh Phô Mai Cà Phê',
    slug: 'banh-pho-mai-ca-phe',
    price: 35000,
    image_url:
      'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80',
    description:
      'Hương vị phô mai béo ngậy hòa quyện cùng cà phê thơm ngát với lớp đế bánh quy giòn tan.',
    is_available: true,
  },
  {
    id: 17,
    category_id: 4,
    name: 'Bánh Tiramisu',
    slug: 'banh-tiramisu',
    price: 39000,
    image_url:
      'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80',
    description:
      'Bánh Tiramisu truyền thống nước Ý với phô mai Mascarpone béo dịu và hương cà phê thơm nức.',
    is_available: true,
  },
  {
    id: 18,
    category_id: 4,
    name: 'Bánh Mì Que Pate Cay',
    slug: 'banh-mi-que-pate-cay',
    price: 25000,
    image_url:
      'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
    description:
      'Vỏ bánh mì que nướng giòn rụm bên ngoài, nhân pate béo ngậy cùng tương ớt cay nồng đậm vị truyền thống.',
    is_available: true,
  },
]

export const users = [
  {
    id: 1,
    email: 'customer@highland.vn',
    password: 'Customer@123456',
    full_name: 'Nguyễn Văn Khách',
    phone: '0912345678',
    role: 'customer',
    is_active: true,
    created_at: '2024-03-02T08:15:00Z',
  },
  {
    id: 2,
    email: 'admin@highland.vn',
    password: 'Admin@123456',
    full_name: 'Highlands Administrator',
    phone: '0901234567',
    role: 'admin',
    is_active: true,
    created_at: '2024-01-08T02:00:00Z',
  },
]

const item = (id, productId, quantity) => {
  const product = products.find((p) => p.id === productId)
  return {
    id,
    product_id: product.id,
    product_name: product.name,
    unit_price: product.price,
    quantity,
    subtotal: product.price * quantity,
  }
}

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

export const orders = [
  {
    id: 1042,
    user_id: 1,
    status: 'completed',
    total_amount: 146000,
    receiver_name: 'Nguyễn Văn Khách',
    phone: '0912345678',
    address: '12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    note: 'Ít đá, sữa đá dày hơn.',
    created_at: daysAgo(20),
    completed_at: daysAgo(19),
    items: [item(1, 1, 2), item(2, 15, 1), item(3, 18, 2)],
  },
  {
    id: 1043,
    user_id: 1,
    status: 'preparing',
    total_amount: 108000,
    receiver_name: 'Nguyễn Văn Khách',
    phone: '0912345678',
    address: '12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    note: null,
    created_at: daysAgo(2),
    completed_at: null,
    items: [item(4, 6, 1), item(5, 8, 1)],
  },
  {
    id: 1044,
    user_id: 1,
    status: 'confirmed',
    total_amount: 137000,
    receiver_name: 'Nguyễn Văn Khách',
    phone: '0912345678',
    address: '212 Điện Biên Phủ, Quận 3, TP. Hồ Chí Minh',
    note: 'Gọi trước khi giao.',
    created_at: daysAgo(1),
    completed_at: null,
    items: [item(6, 12, 1), item(7, 16, 1), item(8, 17, 1)],
  },
  {
    id: 1045,
    user_id: 1,
    status: 'pending',
    total_amount: 78000,
    receiver_name: 'Nguyễn Văn Khách',
    phone: '0912345678',
    address: '45 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
    note: null,
    created_at: daysAgo(0),
    completed_at: null,
    items: [item(9, 3, 2)],
  },
  {
    id: 1046,
    user_id: 1,
    status: 'cancelled',
    total_amount: 59000,
    receiver_name: 'Nguyễn Văn Khách',
    phone: '0912345678',
    address: '45 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
    note: 'Đặt nhầm, huỷ giúp em.',
    created_at: daysAgo(7),
    completed_at: null,
    items: [item(10, 13, 1)],
  },
  {
    id: 1047,
    user_id: 1,
    status: 'completed',
    total_amount: 165000,
    receiver_name: 'Nguyễn Văn Khách',
    phone: '0912345678',
    address: '88 Lý Tự Trọng, Quận 1, TP. Hồ Chí Minh',
    note: null,
    created_at: daysAgo(5),
    completed_at: daysAgo(4),
    items: [item(11, 5, 1), item(12, 9, 1), item(13, 11, 1)],
  },
  {
    id: 1048,
    user_id: 1,
    status: 'completed',
    total_amount: 49000,
    receiver_name: 'Nguyễn Văn Khách',
    phone: '0912345678',
    address: '88 Lý Tự Trọng, Quận 1, TP. Hồ Chí Minh',
    note: null,
    created_at: daysAgo(4),
    completed_at: daysAgo(3),
    items: [item(14, 2, 1)],
  },
  {
    id: 1049,
    user_id: 1,
    status: 'completed',
    total_amount: 88000,
    receiver_name: 'Nguyễn Văn Khách',
    phone: '0912345678',
    address: '88 Lý Tự Trọng, Quận 1, TP. Hồ Chí Minh',
    note: null,
    created_at: daysAgo(3),
    completed_at: daysAgo(2),
    items: [item(15, 10, 1), item(16, 14, 1)],
  },
]

export const siteInfo = {
  name: 'Highlands Coffee',
  tagline: 'Pha phin từ 2013',
  phone: '1900 545 449',
  address: '92–96 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh',
  hours: '07:00 – 22:00 hằng ngày',
}

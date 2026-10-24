/**
 * Adapter giả lập: mô phỏng đúng REST API của backend (method, path, shape)
 * để giao diện chạy được khi chưa có API thật.
 * Bật/tắt bằng VITE_USE_MOCK trong frontend/.env
 */
import { ApiError } from '../api/errors'
import { getToken } from '../api/session'
import {
  categories as seedCategories,
  products as seedProducts,
  users as seedUsers,
  orders as seedOrders,
  orderTransitions,
} from './data'

const db = {
  categories: structuredClone(seedCategories),
  products: structuredClone(seedProducts),
  users: structuredClone(seedUsers),
  orders: structuredClone(seedOrders),
  carts: new Map(),
  counters: { product: 100, category: 100, order: 2000, cart: 100, user: 100 },
}

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

const publicUser = (user) => {
  const { password: _password, ...rest } = user
  return rest
}

const withCategory = (product) => ({
  ...product,
  category: db.categories.find((c) => c.id === product.category_id) ?? null,
})

function currentUser() {
  const token = getToken()
  if (!token) throw new ApiError(401, 'Bạn cần đăng nhập để tiếp tục.')
  const id = Number(String(token).split('.')[1])
  const user = db.users.find((u) => u.id === id)
  if (!user) throw new ApiError(401, 'Phiên đăng nhập không còn hợp lệ.')
  return user
}

function currentAdmin() {
  const user = currentUser()
  if (user.role !== 'admin') throw new ApiError(403, 'Chỉ quản trị viên mới được thao tác.')
  return user
}

const nextId = (kind) => {
  db.counters[kind] += 1
  return db.counters[kind]
}

/* ------------------------------ Auth ------------------------------ */

async function login(body) {
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  const user = db.users.find((u) => u.email.toLowerCase() === email)
  if (!user || user.password !== password) {
    throw new ApiError(401, 'Email hoặc mật khẩu không đúng.')
  }
  if (!user.is_active) throw new ApiError(403, 'Tài khoản đã bị khoá.')
  return {
    access_token: `mock.${user.id}.${Date.now().toString(36)}`,
    token_type: 'bearer',
    user: publicUser(user),
  }
}

async function register(body) {
  const email = String(body?.email ?? '').trim().toLowerCase()
  const fullName = String(body?.full_name ?? '').trim()
  const password = String(body?.password ?? '')
  const phone = body?.phone ? String(body.phone).trim() : null

  if (!fullName) throw new ApiError(400, 'Vui lòng nhập họ tên.')
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError(400, 'Email không hợp lệ.')
  if (password.length < 8) throw new ApiError(400, 'Mật khẩu cần ít nhất 8 ký tự.')
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    throw new ApiError(400, 'Mật khẩu phải có cả chữ cái và chữ số.')
  }
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    throw new ApiError(400, 'Email này đã được dùng để đăng ký.')
  }

  const user = {
    id: nextId('user'),
    email,
    password,
    full_name: fullName,
    phone,
    role: 'customer',
    is_active: true,
    created_at: new Date().toISOString(),
  }
  db.users.push(user)
  return {
    access_token: `mock.${user.id}.${Date.now().toString(36)}`,
    token_type: 'bearer',
    user: publicUser(user),
  }
}

async function me() {
  return publicUser(currentUser())
}

async function updateMe(body) {
  const user = currentUser()
  if (body?.full_name !== undefined) {
    if (!String(body.full_name).trim()) throw new ApiError(400, 'Họ tên không được để trống.')
    user.full_name = String(body.full_name).trim()
  }
  if (body?.phone !== undefined) user.phone = body.phone ? String(body.phone).trim() : null
  return publicUser(user)
}

/* --------------------------- Categories --------------------------- */

async function listCategories() {
  return db.categories.map((c) => ({ ...c }))
}

async function getCategory(id) {
  const category = db.categories.find((c) => c.id === id)
  if (!category) throw new ApiError(404, `Không tìm thấy nhóm ${id}.`)
  return { ...category }
}

async function createCategory(body) {
  currentAdmin()
  const name = String(body?.name ?? '').trim()
  const slug = String(body?.slug ?? '').trim()
  if (!name || !slug) throw new ApiError(400, 'Tên nhóm và slug là bắt buộc.')
  if (db.categories.some((c) => c.slug === slug)) {
    throw new ApiError(400, `Slug '${slug}' đã tồn tại.`)
  }
  const category = {
    id: nextId('category'),
    name,
    slug,
    description: body?.description ?? null,
  }
  db.categories.push(category)
  return { ...category }
}

async function updateCategory(id, body) {
  currentAdmin()
  const category = db.categories.find((c) => c.id === id)
  if (!category) throw new ApiError(404, `Không tìm thấy nhóm ${id}.`)
  if (body?.name) category.name = String(body.name).trim()
  if (body?.slug) category.slug = String(body.slug).trim()
  if (body?.description !== undefined) category.description = body.description
  return { ...category }
}

async function deleteCategory(id) {
  currentAdmin()
  const index = db.categories.findIndex((c) => c.id === id)
  if (index === -1) throw new ApiError(404, `Không tìm thấy nhóm ${id}.`)
  if (db.products.some((p) => p.category_id === id)) {
    throw new ApiError(400, 'Nhóm này còn sản phẩm nên không thể xoá.')
  }
  db.categories.splice(index, 1)
  return null
}

/* ----------------------------- Products ---------------------------- */

async function listProducts(query) {
  const availableOnly = query.available_only !== false && query.available_only !== 'false'
  const items = db.products
    .filter((p) => (availableOnly ? p.is_available : true))
    .filter((p) => (query.category_id ? p.category_id === Number(query.category_id) : true))
    .filter((p) => (query.min_price !== undefined ? p.price >= Number(query.min_price) : true))
    .filter((p) => (query.max_price !== undefined ? p.price <= Number(query.max_price) : true))
    .filter((p) => {
      const keyword = String(query.q ?? '').trim().toLowerCase()
      if (!keyword) return true
      return (
        p.name.toLowerCase().includes(keyword) ||
        String(p.description ?? '').toLowerCase().includes(keyword)
      )
    })
    .sort((a, b) => b.id - a.id)

  const page = Math.max(1, Number(query.page ?? 1))
  const size = Math.min(100, Math.max(1, Number(query.size ?? 12)))
  const start = (page - 1) * size
  const pageItems = items.slice(start, start + size).map(withCategory)

  return {
    items: pageItems,
    total: items.length,
    page,
    size,
    total_pages: Math.ceil(items.length / size),
  }
}

async function getProduct(id) {
  const product = db.products.find((p) => p.id === id)
  if (!product) throw new ApiError(404, `Không tìm thấy sản phẩm ${id}.`)
  return withCategory(product)
}

async function createProduct(body) {
  currentAdmin()
  const name = String(body?.name ?? '').trim()
  const slug = String(body?.slug ?? '').trim()
  if (!name || !slug) throw new ApiError(400, 'Tên sản phẩm và slug là bắt buộc.')
  if (!db.categories.some((c) => c.id === Number(body?.category_id))) {
    throw new ApiError(400, `Nhóm ${body?.category_id} không tồn tại.`)
  }
  if (db.products.some((p) => p.slug === slug)) {
    throw new ApiError(400, `Slug '${slug}' đã tồn tại.`)
  }
  const product = {
    id: nextId('product'),
    category_id: Number(body.category_id),
    name,
    slug,
    description: body?.description ?? null,
    image_url: body?.image_url ?? null,
    price: Number(body?.price ?? 0),
    is_available: body?.is_available ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.products.push(product)
  return withCategory(product)
}

async function updateProduct(id, body) {
  currentAdmin()
  const product = db.products.find((p) => p.id === id)
  if (!product) throw new ApiError(404, `Không tìm thấy sản phẩm ${id}.`)
  if (body?.category_id !== undefined) {
    if (!db.categories.some((c) => c.id === Number(body.category_id))) {
      throw new ApiError(400, `Nhóm ${body.category_id} không tồn tại.`)
    }
    product.category_id = Number(body.category_id)
  }
  if (body?.slug) product.slug = String(body.slug).trim()
  if (body?.name) product.name = String(body.name).trim()
  if (body?.description !== undefined) product.description = body.description
  if (body?.image_url !== undefined) product.image_url = body.image_url
  if (body?.price !== undefined) product.price = Number(body.price)
  if (body?.is_available !== undefined) product.is_available = Boolean(body.is_available)
  product.updated_at = new Date().toISOString()
  return withCategory(product)
}

async function deleteProduct(id) {
  currentAdmin()
  const product = db.products.find((p) => p.id === id)
  if (!product) throw new ApiError(404, `Không tìm thấy sản phẩm ${id}.`)
  product.is_available = false
  return { message: `Sản phẩm ${id} đã được ẩn khỏi thực đơn.`, is_available: false }
}

async function deleteProductPermanently(id) {
  currentAdmin()
  const productIndex = db.products.findIndex((product) => product.id === id)
  if (productIndex < 0) throw new ApiError(404, `Không tìm thấy sản phẩm ${id}.`)
  if (db.products[productIndex].is_available) {
    throw new ApiError(409, 'Hãy ẩn món trước khi xóa vĩnh viễn.')
  }
  const hasOrderHistory = db.orders.some((order) =>
    order.items.some((item) => item.product_id === id),
  )
  if (hasOrderHistory) {
    throw new ApiError(409, 'Món đã có trong lịch sử đơn hàng. Hãy ẩn món thay vì xoá vĩnh viễn.')
  }
  db.products.splice(productIndex, 1)
  for (const cart of db.carts.values()) {
    const index = cart.findIndex((item) => item.product_id === id)
    if (index >= 0) cart.splice(index, 1)
  }
  return { message: `Đã xoá vĩnh viễn sản phẩm ${id}.` }
}

/* ------------------------------- Cart ------------------------------- */

function cartOf(userId) {
  if (!db.carts.has(userId)) db.carts.set(userId, [])
  return db.carts.get(userId)
}

function cartResponse(userId) {
  const cart = cartOf(userId)
  const items = cart
    .map((entry) => {
      const product = db.products.find((p) => p.id === entry.product_id)
      if (!product) return null
      return {
        id: entry.id,
        user_id: userId,
        product_id: product.id,
        quantity: entry.quantity,
        product: withCategory(product),
      }
    })
    .filter(Boolean)
  return {
    items,
    total_quantity: items.reduce((sum, i) => sum + i.quantity, 0),
    total_amount: items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  }
}

async function getCart() {
  return cartResponse(currentUser().id)
}

async function addToCart(body) {
  const user = currentUser()
  const productId = Number(body?.product_id)
  const quantity = Number(body?.quantity ?? 1)
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new ApiError(400, 'Số lượng phải từ 1 trở lên.')
  }
  const product = db.products.find((p) => p.id === productId)
  if (!product) throw new ApiError(404, `Không tìm thấy sản phẩm ${productId}.`)
  if (!product.is_available) throw new ApiError(400, 'Sản phẩm này tạm hết hàng.')

  const cart = cartOf(user.id)
  const existing = cart.find((entry) => entry.product_id === productId)
  if (existing) existing.quantity += quantity
  else cart.push({ id: nextId('cart'), product_id: productId, quantity })

  return cartResponse(user.id)
}

async function updateCartItem(id, body) {
  const user = currentUser()
  const quantity = Number(body?.quantity)
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new ApiError(400, 'Số lượng phải từ 1 trở lên.')
  }
  const cart = cartOf(user.id)
  const entry = cart.find((item) => item.id === id)
  if (!entry) throw new ApiError(404, `Không tìm thấy món ${id} trong giỏ.`)
  entry.quantity = quantity
  return cartResponse(user.id)
}

async function removeCartItem(id) {
  const user = currentUser()
  const cart = cartOf(user.id)
  const index = cart.findIndex((item) => item.id === id)
  if (index === -1) throw new ApiError(404, `Không tìm thấy món ${id} trong giỏ.`)
  cart.splice(index, 1)
  return cartResponse(user.id)
}

async function clearCart() {
  const user = currentUser()
  db.carts.set(user.id, [])
  return cartResponse(user.id)
}

/* ------------------------------ Orders ------------------------------ */

function paginate(list, query) {
  const page = Math.max(1, Number(query.page ?? 1))
  const size = Math.min(100, Math.max(1, Number(query.size ?? 12)))
  const start = (page - 1) * size
  return {
    items: list.slice(start, start + size),
    total: list.length,
    page,
    size,
    total_pages: Math.ceil(list.length / size),
  }
}

function orderWithUser(order) {
  const user = db.users.find((u) => u.id === order.user_id)
  return { ...order, user: user ? publicUser(user) : null }
}

async function createOrder(body) {
  const user = currentUser()
  const cart = cartOf(user.id)
  if (cart.length === 0) throw new ApiError(400, 'Giỏ hàng đang trống.')

  const receiverName = String(body?.receiver_name ?? '').trim()
  const phone = String(body?.phone ?? '').trim()
  const address = String(body?.address ?? '').trim()
  if (!receiverName) throw new ApiError(400, 'Vui lòng nhập tên người nhận.')
  if (phone.length < 8) throw new ApiError(400, 'Số điện thoại không hợp lệ.')
  if (address.length < 3) throw new ApiError(400, 'Vui lòng nhập địa chỉ giao hàng.')

  const items = cart.map((entry) => {
    const product = db.products.find((p) => p.id === entry.product_id)
    return {
      id: nextId('order_item'),
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      quantity: entry.quantity,
      subtotal: product.price * entry.quantity,
    }
  })

  const order = {
    id: nextId('order'),
    user_id: user.id,
    status: 'pending',
    total_amount: items.reduce((sum, i) => sum + i.subtotal, 0),
    receiver_name: receiverName,
    phone,
    address,
    note: body?.note ? String(body.note).trim() : null,
    created_at: new Date().toISOString(),
    completed_at: null,
    items,
  }
  db.orders.unshift(order)
  db.carts.set(user.id, [])
  return orderWithUser(order)
}

async function listMyOrders(query) {
  const user = currentUser()
  const mine = db.orders
    .filter((o) => o.user_id === user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(orderWithUser)
  return paginate(mine, query)
}

async function getOrder(id) {
  const user = currentUser()
  const order = db.orders.find((o) => o.id === id)
  if (!order) throw new ApiError(404, `Không tìm thấy đơn ${id}.`)
  if (order.user_id !== user.id && user.role !== 'admin') {
    throw new ApiError(403, 'Bạn không được xem đơn này.')
  }
  return orderWithUser(order)
}

async function listAllOrders(query) {
  currentAdmin()
  const status = query.status ? String(query.status) : null
  const all = db.orders
    .filter((order) => (status ? order.status === status : true))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(orderWithUser)
  return paginate(all, query)
}

async function getRevenueAnalytics(query) {
  currentAdmin()
  if (Boolean(query.start_date) !== Boolean(query.end_date)) {
    throw new ApiError(400, 'Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc.')
  }
  const localDate = (value) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value)
    const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    return `${fields.year}-${fields.month}-${fields.day}`
  }
  const shiftDate = (value, offset) => {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10)
  }
  const today = localDate(new Date())
  const requestedDays = Math.min(30, Math.max(1, Number(query.days ?? 7)))
  const startDate = query.start_date ?? shiftDate(today, -(requestedDays - 1))
  const endDate = query.end_date ?? today
  const days =
    Math.floor(
      (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) /
        86400000,
    ) + 1
  if (
    !Number.isInteger(days) ||
    days < 1 ||
    days > 366 ||
    startDate > endDate ||
    endDate > today
  ) {
    throw new ApiError(400, 'Khoảng ngày không hợp lệ (tối đa 366 ngày và không chọn ngày tương lai).')
  }
  const dates = Array.from({ length: days }, (_, index) => shiftDate(startDate, index))
  const previousDates = Array.from({ length: days }, (_, index) => shiftDate(startDate, index - days))
  const allDates = [...previousDates, ...dates]
  const revenue = new Map(allDates.map((date) => [date, 0]))
  const orderCounts = new Map(allDates.map((date) => [date, 0]))

  db.orders.forEach((order) => {
    if (order.status !== 'completed' || !order.completed_at) return
    const date = localDate(new Date(order.completed_at))
    if (!revenue.has(date)) return
    revenue.set(date, revenue.get(date) + order.total_amount)
    orderCounts.set(date, orderCounts.get(date) + 1)
  })

  const totalRevenue = dates.reduce((total, date) => total + revenue.get(date), 0)
  const completedOrders = dates.reduce((total, date) => total + orderCounts.get(date), 0)
  const previousRevenue = previousDates.reduce((total, date) => total + revenue.get(date), 0)
  const previousOrders = previousDates.reduce((total, date) => total + orderCounts.get(date), 0)

  return {
    days,
    start_date: startDate,
    end_date: endDate,
    items: dates.map((date) => ({ date, revenue: revenue.get(date) })),
    summary: {
      revenue: totalRevenue,
      completed_orders: completedOrders,
      average_order_value: completedOrders ? Math.round(totalRevenue / completedOrders) : 0,
      previous_revenue: previousRevenue,
      previous_completed_orders: previousOrders,
      revenue_change_percent: previousRevenue
        ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 1000) / 10
        : null,
    },
  }
}

async function updateOrderStatus(id, body) {
  currentAdmin()
  const order = db.orders.find((o) => o.id === id)
  if (!order) throw new ApiError(404, `Không tìm thấy đơn ${id}.`)
  const next = String(body?.status ?? '')
  const allowed = orderTransitions[order.status] ?? []
  if (!allowed.includes(next)) {
    throw new ApiError(
      400,
      `Không thể chuyển đơn từ "${order.status}" sang "${next}".`,
    )
  }
  order.status = next
  order.completed_at = next === 'completed' ? new Date().toISOString() : null
  return orderWithUser(order)
}

/* ------------------------------ Router ------------------------------ */

const routes = [
  { method: 'POST', pattern: /^\/auth\/login$/, handler: (_id, body) => login(body) },
  { method: 'POST', pattern: /^\/auth\/register$/, handler: (_id, body) => register(body) },
  { method: 'GET', pattern: /^\/auth\/me$/, handler: () => me() },
  { method: 'PUT', pattern: /^\/auth\/me$/, handler: (_id, body) => updateMe(body) },
  { method: 'GET', pattern: /^\/categories$/, handler: () => listCategories() },
  { method: 'POST', pattern: /^\/categories$/, handler: (_id, body) => createCategory(body) },
  { method: 'GET', pattern: /^\/categories\/(\d+)$/, handler: (id) => getCategory(id) },
  {
    method: 'PUT',
    pattern: /^\/categories\/(\d+)$/,
    handler: (id, body) => updateCategory(id, body),
  },
  {
    method: 'DELETE',
    pattern: /^\/categories\/(\d+)$/,
    handler: (id) => deleteCategory(id),
  },
  { method: 'GET', pattern: /^\/products$/, handler: (_id, body) => listProducts(body) },
  { method: 'POST', pattern: /^\/products$/, handler: (_id, body) => createProduct(body) },
  { method: 'GET', pattern: /^\/products\/(\d+)$/, handler: (id) => getProduct(id) },
  { method: 'PUT', pattern: /^\/products\/(\d+)$/, handler: (id, body) => updateProduct(id, body) },
  {
    method: 'DELETE',
    pattern: /^\/products\/(\d+)\/permanent$/,
    handler: (id) => deleteProductPermanently(id),
  },
  { method: 'DELETE', pattern: /^\/products\/(\d+)$/, handler: (id) => deleteProduct(id) },
  { method: 'GET', pattern: /^\/cart\/items$/, handler: () => getCart() },
  { method: 'POST', pattern: /^\/cart\/items$/, handler: (_id, body) => addToCart(body) },
  {
    method: 'PATCH',
    pattern: /^\/cart\/items\/(\d+)$/,
    handler: (id, body) => updateCartItem(id, body),
  },
  {
    method: 'DELETE',
    pattern: /^\/cart\/items\/(\d+)$/,
    handler: (id) => removeCartItem(id),
  },
  { method: 'DELETE', pattern: /^\/cart\/items$/, handler: () => clearCart() },
  { method: 'POST', pattern: /^\/orders$/, handler: (_id, body) => createOrder(body) },
  { method: 'GET', pattern: /^\/orders$/, handler: (_id, body) => listMyOrders(body) },
  { method: 'GET', pattern: /^\/orders\/(\d+)$/, handler: (id) => getOrder(id) },
  { method: 'GET', pattern: /^\/admin\/orders$/, handler: (_id, body) => listAllOrders(body) },
  {
    method: 'GET',
    pattern: /^\/admin\/analytics\/revenue$/,
    handler: (_id, body) => getRevenueAnalytics(body),
  },
  {
    method: 'PATCH',
    pattern: /^\/admin\/orders\/(\d+)\/status$/,
    handler: (id, body) => updateOrderStatus(id, body),
  },
]

export async function mockRequest(method, path, { body = {} } = {}) {
  await wait()
  for (const route of routes) {
    if (route.method !== method) continue
    const match = path.match(route.pattern)
    if (!match) continue
    const id = match[1] ? Number(match[1]) : null
    return route.handler(id, body)
  }
  throw new ApiError(404, `Không tìm thấy endpoint ${method} ${path}.`)
}

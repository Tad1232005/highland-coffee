# Frontend - Highland Coffee Web Client

Giao diện web bán cà phê Highlands: **React 19 + Vite 8 + React Router 7 + Axios**, CSS thuần (không dùng UI framework).

- Dev server: `http://localhost:5173`
- API backend: `http://localhost:8000/api`
- Chế độ demo (mock data, không cần backend): bật mặc định

---

## Yêu cầu

| Công cụ | Phiên bản |
|---------|-----------|
| Node.js | 20.19+ / 22.13+ / 24 |
| npm | 10+ |

Không bắt buộc backend khi chạy chế độ demo (mock). Xem [`../backend/README.md`](../backend/README.md) khi dùng API thật.

---

## Cài đặt

```bash
cd frontend

# 1. Cài dependencies
npm ci

# 2. Tạo file env (nếu chưa có)
# Windows (PowerShell)
Copy-Item .env.example .env
# macOS / Linux
# cp .env.example .env

# 3. Chạy dev server
npm run dev
```

Mở `http://localhost:5173`.

---

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Vite dev server + HMR |
| `npm run build` | Build production vào `dist/` |
| `npm run preview` | Xem thử bản build production |
| `npm run lint` | ESLint cho toàn bộ `src/` |
| `npm run test` | Vitest (jsdom) |

---

## Biến môi trường

Vite chỉ expose các biến có tiền tố `VITE_`. Đặt trong `frontend/.env`:

```env
# API backend (chỉ dùng khi VITE_USE_MOCK=false)
VITE_API_BASE_URL=http://localhost:8000/api

# Demo mode: true = dữ liệu giả lập trong src/mock, false = gọi API thật
VITE_USE_MOCK=true
```

`src/api/client.js` chọn cổng gọi theo `VITE_USE_MOCK` (mặc định `true` khi biến không được set). Cả hai chế độ trả về **cùng shape dữ liệu**, nên đổi qua lại không phải sửa component.

### Tài khoản demo (chỉ có ở chế độ mock)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Quản trị | `admin@highland.vn` | `Admin@123456` |
| Khách | `customer@highland.vn` | `Customer@123456` |

Trang đăng nhập khách có nút **"Đăng nhập khu vực quản trị"** để nhảy sang `/admin/login` (admin có màn hình đăng nhập riêng), kèm hai chip **tài khoản demo** điền nhanh vào form.

---

## Cấu trúc thư mục

```text
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   ├── client.js        # Axios instance + cổng mock, interceptor token / 401
│   │   ├── errors.js        # ApiError chuẩn hoá lỗi HTTP
│   │   ├── index.js         # Service modules (auth, categories, products, cart, orders, admin)
│   │   └── session.js       # token + user trong localStorage
│   ├── components/
│   │   ├── AccountLinks.jsx # Nội dung menu tài khoản (dùng chung desktop + mobile)
│   │   ├── AccountMenu.jsx  # Nút tài khoản + dropdown trên header
│   │   ├── CategoryTabs.jsx # Tabs danh mục (không tràn ngang)
│   │   ├── ConfirmProvider.jsx # Hộp thoại xác nhận (Promise<boolean>)
│   │   ├── EmptyState.jsx   # Trạng thái rỗng có CTA tùy chọn
│   │   ├── Footer.jsx
│   │   ├── Header.jsx       # Header + thanh tìm kiếm + menu tài khoản
│   │   ├── icons.jsx        # Icon SVG nội tuyến
│   │   ├── Loading.jsx
│   │   ├── MobileTabBar.jsx # Bottom tab bar cho mobile
│   │   ├── Modal.jsx        # Dialog nền tối + bottom sheet
│   │   ├── PhinDrip.jsx     # SVG phin giọt rơi (chạm của thương hiệu)
│   │   ├── ProductCard.jsx
│   │   ├── QuantityStepper.jsx
│   │   ├── SiteLayout.jsx   # Khung trang: header + main + footer + tab bar
│   │   ├── StatusBadge.jsx  # Badge trạng thái đơn hàng
│   │   ├── ToastProvider.jsx # Thông báo toast góc màn hình
│   │   └── index.js
│   ├── content/
│   │   ├── orders.js        # orderTransitions, orderStatusLabels, orderFlow
│   │   └── site.js          # Tên thương hiệu, SĐT, địa chỉ
│   ├── context/
│   │   ├── AuthProvider.jsx # Đăng nhập/đăng xuất, token, user
│   │   ├── CartProvider.jsx # Giỏ hàng + số lượng badge
│   │   ├── authContext.js   # Context + hook (useAuth)
│   │   ├── cartContext.js   # Context + hook (useCart)
│   │   ├── confirmContext.js # Context + hook (useConfirm)
│   │   ├── toastContext.js  # Context + hook (useToast)
│   │   └── index.js
│   ├── hooks/
│   │   ├── useAsyncData.js  # Hook tải dữ liệu theo key (không setState trong effect)
│   │   └── useLogout.js     # Đăng xuất kèm confirm + toast
│   ├── mock/
│   │   ├── adapter.js       # Router giả lập REST, mirror contract backend
│   │   └── data.js          # Dataset demo (món, danh mục, đơn hàng, user)
│   ├── pages/
│   │   ├── Home.jsx         # Hero + món nổi bật + mục "Về Highlands"
│   │   ├── Menu.jsx         # Tìm kiếm, lọc danh mục, lọc giá, phân trang
│   │   ├── ProductDetail.jsx
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── MyOrders.jsx     # Timeline trạng thái đơn
│   │   ├── Login.jsx        # Trang đăng nhập (thẻ card căn giữa)
│   │   ├── Register.jsx     # Trang đăng ký
│   │   ├── NotFound.jsx
│   │   ├── admin/
│   │   │   ├── AdminLayout.jsx      # Khung trang quản trị
│   │   │   ├── AdminLogin.jsx       # Màn hình đăng nhập riêng cho admin
│   │   │   ├── AdminOrders.jsx      # Bảng đơn + chuyển trạng thái
│   │   │   ├── AdminProducts.jsx    # Bảng món + sửa nhanh + ẩn món
│   │   │   └── AdminCategories.jsx  # Bảng nhóm + thêm/sửa/xoá
│   │   └── index.js
│   ├── routes/
│   │   └── index.jsx        # React Router + RequireAuth / RequireAdmin
│   ├── styles/
│   │   ├── hero.css         # Style hero + keyframes phin rơi
│   │   └── pages.css        # Style cấp trang
│   ├── utils/
│   │   ├── format.js        # formatPrice, formatDate, slugify...
│   │   └── validation.js    # validateLogin / validateRegister (dùng chung 2 form)
│   ├── App.jsx              # BrowserRouter + providers
│   ├── App.test.jsx         # Smoke test
│   ├── index.css            # Design system & theme Highlands
│   └── main.jsx
├── .env.example
├── eslint.config.js         # Cấu hình ESLint (flat config)
├── vite.config.js
└── package.json
```

---

## Design system

Theme Highlands Coffee nằm trong `src/index.css` (biến CSS) và được tách theo lớp:

| File | Vai trò |
|------|---------|
| `src/index.css` | Token màu, font, spacing, reset, primitive (button, badge, field, table) |
| `src/styles/hero.css` | Hero + animation phin rơi |
| `src/styles/pages.css` | Layout cấp trang: menu, chi tiết, giỏ, checkout, đơn hàng, admin |

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--color-roast` | `#1F1410` | Nền tối, chữ trên nền sáng |
| `--color-porcelain` | `#FAF7F2` | Nền trang |
| `--color-condensed` | `#F0DFC0` | Nền phụ (section thay nhịp) |
| `--color-highland` | `#D62828` | CTA, giá, điểm nhấn thương hiệu |
| `--color-lotus` | `#5A8A54` | Trạng thái thành công |
| `--color-ink` | `#2B211C` | Chữ chính |

Font: **Fraunces** (display) + **Be Vietnam Pro** (UI, hỗ trợ tiếng Việt) — load từ Google Fonts.

Quy ước: dùng biến CSS (`--color-*`, `--space-*`) thay vì hard-code màu/khoảng cách.

---

## UI primitives

| Thành phần | Dùng khi nào |
|------------|--------------|
| `Modal` | Dialog nền tối (`size="sm|md|lg"`) hoặc bottom sheet (`size="sheet"`): portal vào `body`, khoá scroll, focus trap, đóng bằng Esc / click ngoài |
| `ToastProvider` + `useToast()` | Thông báo kết quả thao tác: `notify('Đã lưu', { type: 'success' \| 'error' \| 'info' })` |
| `ConfirmProvider` + `useConfirm()` | Thay `window.confirm`: `const ok = await confirm({ title, message, danger: true })` |
| `AccountMenu` / `AccountLinks` | Menu tài khoản: dropdown trên header (desktop) và bottom sheet trong tab bar (mobile) |

Thứ tự provider trong `src/App.jsx` (quan trọng cho `useLogout`):

```text
BrowserRouter > ToastProvider > ConfirmProvider > AuthProvider > CartProvider > AppRoutes
```

Nút **Đăng xuất** luôn hiện ở header (desktop), trong menu tài khoản, trong bottom sheet mobile và ở footer — dùng chung hook `src/hooks/useLogout.js` (confirm → xoá phiên → toast → về trang chủ).

---

## Kiểm thử

```bash
npm run test
```

Vitest + Testing Library (jsdom). Bộ test hiện tại:

| File | Phạm vi |
|------|---------|
| `src/App.test.jsx` | Smoke test toàn trang |
| `src/pages/Login.test.jsx` | Validate form rỗng, chip tài khoản demo, đăng nhập thành công |
| `src/pages/Register.test.jsx` | Validate tên/email/mật khẩu, tạo tài khoản |
| `src/components/ConfirmProvider.test.jsx` | `confirm()` trả về `true`/`false` theo lựa chọn của người dùng |

> `vite.config.js` bật `test.globals = true` để Testing Library tự dọn DOM giữa các test.

---

## Routing đi kiện

| Path | Trang | Quyền |
|------|-------|-------|
| `/` | Home | Công khai |
| `/menu` | Menu (tìm kiếm, lọc danh mục, lọc giá, phân trang) | Công khai |
| `/products/:id` | Chi tiết sản phẩm | Công khai |
| `/cart` | Giỏ hàng | Đã đăng nhập |
| `/checkout` | Thanh toán | Đã đăng nhập |
| `/my-orders` | Đơn của tôi | Đã đăng nhập |
| `/login`, `/register` | Đăng nhập / Đăng ký | Công khai |
| `/admin/login` | Đăng nhập quản trị | Công khai |
| `/admin` | Quản trị: đơn hàng, sản phẩm, danh mục | `role === "admin"` |
| `*` | 404 | Công khai |

`RequireAuth` chỉ khách đã đăng nhập, `RequireAdmin` chỉ user có `role === "admin"`.

---

## Kết nối API

`src/api/index.js` bọc một cổng gọi duy nhất (`request`), dùng chung cho cả hai chế độ:

- `baseURL` lấy từ `VITE_API_BASE_URL`
- Request interceptor gắn `Authorization: Bearer <token>` từ `localStorage`
- Response interceptor: gặp `401` thì xoá token và chuyển hướng `/login`
- Backend dùng JWT nên mọi request cần đăng nhập (giỏ hàng, đơn hàng) đều phải có header trên.

Contract mock (`src/mock/adapter.js`) bám sát backend: `/auth/*`, `/categories`, `/products` (phân trang + lọc), `/cart/items`, `/orders`, `/admin/orders`.

---

## Lint

```bash
npm run lint
```

Dùng ESLint flat config (`eslint.config.js`) với `@eslint/js`, `react-hooks`, `react-refresh`.
Lưu ý: `react-hooks/set-state-in-effect` là **error** → dùng `src/hooks/useAsyncData.js` thay vì `setState` đồng bộ trong `useEffect`.

---

## Build production

```bash
npm run build     # output: dist/
npm run preview   # kiểm tra bản build
```

Khi deploy, cấu hình web server trả `index.html` cho mọi route (SPA fallback) và trỏ `VITE_API_BASE_URL` về domain backend thật.

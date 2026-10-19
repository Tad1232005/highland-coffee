# Frontend — Highland Coffee Web Client

Giao diện đặt đồ uống Highland Coffee: **React 19 + Vite 8 + React Router + Axios**, CSS thuần (không dùng UI framework).

- Dev server: `http://localhost:5173`
- API backend: `http://localhost:8000/api`

---

## Yêu cầu

| Công cụ | Phiên bản |
|---------|-----------|
| Node.js | 20+ |
| npm | 10+ |

Backend và PostgreSQL phải đang chạy (xem [`../backend/README.md`](../backend/README.md)).

---

## Cài đặt

```bash
cd frontend

# 1. Cài dependencies
npm install

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

---

## Biến môi trường

Vite chỉ expose các biến có tiền tố `VITE_`. Đặt trong `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Truy cập trong code qua `import.meta.env.VITE_API_BASE_URL`.

---

## Cấu trúc thư mục

```text
frontend/
├── public/
│   └── icons.svg           # Sprite icon dùng chung
├── src/
│   ├── api/
│   │   └── index.js        # Axios instance + service modules (auth, products, cart, orders)
│   ├── components/
│   │   └── index.js        # Navbar, Footer, ProductCard, Modal, ...
│   ├── context/
│   │   └── index.js        # AuthContext (session/token), CartContext (giỏ hàng, badge)
│   ├── pages/
│   │   └── index.js        # Home, Menu, ProductDetail, Cart, Checkout, MyOrders, Login, Admin
│   ├── routes/
│   │   └── index.js        # React Router + ProtectedRoute / AdminRoute
│   ├── assets/             # Hình ảnh tĩnh
│   ├── App.jsx             # Root component
│   ├── main.jsx            # Entry point, mount vào #root
│   ├── App.css             # Style riêng của App
│   └── index.css           # Design system & theme Highlands
├── .env.example
├── .oxlintrc.json          # Cấu hình Oxlint
├── eslint.config.js        # Cấu hình ESLint (flat config)
├── index.html
├── package.json
└── vite.config.js
```

> Hiện tại các module trong `src/api`, `src/components`, `src/context`, `src/pages`, `src/routes` là **placeholder** (`export default {}`). `App.jsx` vẫn là trang mẫu của Vite — phần giao diện nghiệp vụ sẽ được triển khai tiếp.

---

## Design system

Theme Highlands Coffee trong `src/index.css`:

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| Crimson Red | `#b22830` | CTA, giá, điểm nhấn thương hiệu |
| Gold Roast | `#d4a373` | Accent, badge, hover |
| Warm Espresso | `#2c1810` | Chữ chính, nền tối |

Quy ước: dùng biến CSS (`--color-*`, `--space-*`) thay vì hard-code màu/khoảng cách.

---

## Kết nối API

`src/api/index.js` giữ một Axios instance duy nhất:

- `baseURL` lấy từ `VITE_API_BASE_URL`
- Request interceptor gắn `Authorization: Bearer <token>` từ `localStorage`
- Response interceptor: gặp `401` thì xóa token và điều hướng về `/login`

Backend dùng JWT nên mọi request cần đăng nhập (giỏ hàng, đơn hàng) đều phải có header trên.

---

## Routing dự kiến

| Path | Trang | Quyền |
|------|-------|-------|
| `/` | Home | Công khai |
| `/menu` | Menu (lọc theo danh mục, tìm kiếm) | Công khai |
| `/products/:id` | Chi tiết sản phẩm | Công khai |
| `/cart` | Giỏ hàng | Đã đăng nhập |
| `/checkout` | Thanh toán | Đã đăng nhập |
| `/my-orders` | Đơn của tôi | Đã đăng nhập |
| `/login`, `/register` | Đăng nhập / Đăng ký | Công khai |
| `/admin` | Quản trị sản phẩm & đơn hàng | Admin |

`ProtectedRoute` chặn khách chưa đăng nhập, `AdminRoute` chặn user không phải `role === "admin"`.

---

## Lint

```bash
npm run lint
```

Dùng ESLint flat config (`eslint.config.js`) với `@eslint/js`, `react-hooks`, `react-refresh`.

---

## Build production

```bash
npm run build     # output: dist/
npm run preview   # kiểm tra bản build
```

Khi deploy, cấu hình web server trả `index.html` cho mọi route (SPA fallback) và trỏ `VITE_API_BASE_URL` về domain backend thật.

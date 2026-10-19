# Backend — Highland Coffee API

REST API cho hệ thống đặt đồ uống Highland Coffee, xây dựng bằng **FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL 16**, migration bằng **Alembic**, xác thực bằng **JWT + bcrypt**.

- Base URL: `http://localhost:8000`
- Prefix API: `/api`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Yêu cầu

| Công cụ | Phiên bản |
|---------|-----------|
| Python | 3.12+ |
| PostgreSQL | 16 (chạy qua Docker ở thư mục gốc dự án) |

Cần khởi động database trước khi làm việc:

```bash
# Tại thư mục gốc dự án
docker compose up -d
```

Container `highland_coffee_postgres` lắng nghe ở **port 5555** (map ra ngoài).

---

## Cài đặt

```bash
cd backend

# 1. Tạo & kích hoạt môi trường ảo
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# macOS / Linux
# source .venv/bin/activate

# 2. Cài dependencies
pip install -r requirements.txt

# 3. Migration schema
alembic upgrade head

# 4. Seed dữ liệu mẫu (admin, customer, 4 danh mục, 18 sản phẩm)
python -m app.seed

# 5. Chạy dev server
uvicorn app.main:app --reload --port 8000
```

---

## Biến môi trường

Cấu hình đọc từ file `.env` (đặt trong `backend/`) thông qua `pydantic-settings` — xem `app/core/config.py`.

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5555/highland_coffee` | URL async cho FastAPI |
| `SYNC_DATABASE_URL` | `postgresql+psycopg2://postgres:postgres@localhost:5555/highland_coffee` | URL sync cho Alembic & seed |
| `SECRET_KEY` | (dev key) | Khóa ký JWT — **phải đổi khi production** |
| `ALGORITHM` | `HS256` | Thuật toán JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Thời hạn token (phút) |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:5173", ...]` | Danh sách origin được phép |
| `INITIAL_ADMIN_EMAIL` | `admin@highland.vn` | Email admin seed |
| `INITIAL_ADMIN_PASSWORD` | `Admin@123456` | Mật khẩu admin seed |

> `DATABASE_URL` và `SYNC_DATABASE_URL` **phải cùng trỏ tới một database**.

---

## Tài khoản seed

| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| Admin | `admin@highland.vn` | `Admin@123456` |
| Customer | `customer@highland.vn` | `Customer@123456` |

---

## Cấu trúc thư mục

```text
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py         # /auth: register, login, me
│   │   │   ├── categories.py   # /categories: CRUD (ghi: admin)
│   │   │   ├── products.py     # /products: list/search/filter + CRUD (ghi: admin)
│   │   │   ├── cart.py         # /cart: quản lý giỏ hàng của user
│   │   │   └── orders.py       # /orders + /admin/orders
│   │   ├── deps.py             # get_db, get_current_user, require_admin
│   │   └── api.py              # router tổng, prefix /api
│   ├── core/
│   │   ├── config.py           # Settings (pydantic-settings)
│   │   └── security.py         # bcrypt hash + JWT encode/decode
│   ├── db/
│   │   ├── base.py             # DeclarativeBase
│   │   └── session.py          # async engine (NullPool) + sync engine
│   ├── models/                 # User, Category, Product, CartItem, Order, OrderItem
│   ├── schemas/                # Pydantic v2 request/response
│   ├── main.py                 # FastAPI app + CORS + /api/health
│   └── seed.py                 # Script seed dữ liệu
├── alembic/
│   ├── env.py
│   └── versions/               # Migration scripts
├── tests/
│   ├── conftest.py             # TestClient fixture (session scope)
│   ├── test_auth.py
│   ├── test_products.py
│   └── test_orders.py
├── alembic.ini
├── pyproject.toml              # Cấu hình ruff + pytest
└── requirements.txt
```

---

## API Endpoints

Tất cả endpoint nằm dưới prefix `/api`.

### Auth — `/api/auth`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/register` | — | Đăng ký tài khoản customer (201) |
| POST | `/login` | — | Trả về `access_token` + thông tin user |
| GET | `/me` | Bearer | Thông tin user hiện tại |
| PUT | `/me` | Bearer | Cập nhật `full_name`, `phone` |

### Categories — `/api/categories`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `""` | — | Danh sách danh mục |
| GET | `/{id}` | — | Chi tiết danh mục |
| POST | `""` | Admin | Tạo danh mục (201) |
| PUT | `/{id}` | Admin | Cập nhật danh mục |
| DELETE | `/{id}` | Admin | Xóa danh mục (204) |

### Products — `/api/products`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `""` | — | Danh sách + tìm kiếm + lọc + phân trang |
| GET | `/{id}` | — | Chi tiết sản phẩm |
| POST | `""` | Admin | Tạo sản phẩm (201) |
| PUT | `/{id}` | Admin | Cập nhật sản phẩm |
| DELETE | `/{id}` | Admin | Soft delete: đặt `is_available = false` |

Query params của `GET /api/products`:

| Param | Kiểu | Mặc định | Mô tả |
|-------|------|----------|-------|
| `q` | string | — | Tìm trong `name` / `description` (ILIKE) |
| `category_id` | int | — | Lọc theo danh mục |
| `min_price` | int | — | Giá tối thiểu (VND) |
| `max_price` | int | — | Giá tối đa (VND) |
| `available_only` | bool | `true` | Chỉ lấy sản phẩm đang bán |
| `page` | int | `1` | Trang hiện tại |
| `size` | int | `12` | Số item/trang (1–100) |

Response: `{ items, total, page, size, total_pages }`.

### Cart — `/api/cart` (Bearer bắt buộc)

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/items` | Giỏ hàng hiện tại |
| POST | `/items` | Thêm sản phẩm (đã có thì cộng dồn số lượng) — 201 |
| PATCH | `/items/{item_id}` | Đổi số lượng |
| DELETE | `/items/{item_id}` | Xóa một item |
| DELETE | `/items` | Xóa toàn bộ giỏ — 204 |

Mọi response giỏ hàng có dạng `{ items, total_quantity, total_amount }`.

### Orders — `/api`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/orders` | Bearer | Tạo đơn từ giỏ hàng (201) |
| GET | `/orders` | Bearer | Đơn của chính mình |
| GET | `/orders/{id}` | Bearer | Chi tiết (chủ đơn hoặc admin) |
| GET | `/admin/orders` | Admin | Tất cả đơn, lọc `?status=` |
| PATCH | `/admin/orders/{id}/status` | Admin | Chuyển trạng thái đơn |

**Tạo đơn là một transaction nguyên tử:** snapshot `product_name` + `unit_price` vào `order_items`, tính `total_amount`, xóa sạch giỏ hàng. Giỏ rỗng → 400.

**State machine trạng thái đơn:**

```text
pending ──> confirmed ──> preparing ──> completed
   │            │             │
   └────────────┴─────────────┴──> cancelled

completed, cancelled: trạng thái kết thúc (không chuyển tiếp)
```

Chuyển trạng thái không hợp lệ → **400**.

### Health

`GET /api/health` → `{ "status": "ok", "app": "Highlands Coffee", "version": "1.0.0" }`

---

## Database

6 bảng, quan hệ chính:

```text
users 1──n cart_items n──1 products n──1 categories
users 1──n orders 1──n order_items n──1 products
```

- Giá là **số nguyên VND** (vd. `49000`).
- `cart_items` cascade delete theo user và product.
- `order_items` cascade delete theo order; `RESTRICT` xóa product đang được tham chiếu (bảo toàn lịch sử đơn).
- `order_items.product_name` / `unit_price` là **snapshot** tại thời điểm đặt hàng.

Chi tiết ERD: [`../docs/erd.md`](../docs/erd.md).

### Alembic

```bash
# Áp dụng toàn bộ migration
alembic upgrade head

# Rollback 1 bước
alembic downgrade -1

# Tạo migration mới sau khi sửa model
alembic revision --autogenerate -m "mô_tả_thay_đổi"
alembic upgrade head
```

`alembic/env.py` tự đọc `SYNC_DATABASE_URL` từ `app.core.config.settings`, không cần sửa `sqlalchemy.url` trong `alembic.ini`.

---

## Kiểm thử

```bash
cd backend

pytest -v                        # toàn bộ 9 test
pytest tests/test_auth.py -v     # auth: health, register/login
pytest tests/test_products.py -v # products: list, search, detail, admin CRUD
pytest tests/test_orders.py -v   # cart + order flow, state machine
```

> Test dùng `TestClient` kết nối **database thật** (không dùng SQLite in-memory), nên cần `alembic upgrade head` và `python -m app.seed` trước khi chạy. Đây cũng chính là thứ tự trong CI.

---

## Lint

```bash
cd backend
ruff check .          # kiểm tra
ruff check . --fix    # tự sửa lỗi an toàn
```

Cấu hình ruff trong `pyproject.toml`: line-length 100, rules `E,F,I,W` (bỏ qua `E501`).

---

## Quy ước code

- **SQLAlchemy 2.0**: dùng `Mapped[T]` + `mapped_column`, truy vấn bằng `await db.execute(select(...))` — **không** dùng `db.query()`.
- **Pydantic v2**: `model_config = ConfigDict(from_attributes=True)`, dùng `pattern=` (không dùng `regex=`).
- **Async toàn tuyến** trong routes; engine async dùng `NullPool`.
- Mật khẩu luôn hash bằng bcrypt (`app/core/security.py`), không bao giờ trả `password_hash` ra response.
- Lỗi trả về qua `HTTPException` với `status_code` và `detail` rõ ràng.

---

## Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Cách khắc phục |
|-------------|------------------------|----------------|
| `connection refused` port 5555 | Postgres chưa chạy | `docker compose up -d` |
| Login seed trả 401 | Chưa seed | `python -m app.seed` |
| Test sản phẩm fail vì danh sách rỗng | DB trống | `alembic upgrade head` + `python -m app.seed` |
| `ModuleNotFoundError: app` | Chạy sai thư mục | Chạy lệnh trong `backend/` |
| Alembic không thấy model mới | Chưa import model | Thêm vào `app/models/__init__.py` |

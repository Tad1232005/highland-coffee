# Backend - Highland Coffee API

REST API cho hệ thống đặt đồ ăn uống Highland Coffee, xây dựng bằng **FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL 16**, migration bằng **Alembic**, xác thực bằng **JWT + bcrypt**.

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

Cấu hình đọc từ file `.env` (đặt trong `backend/`) thông qua `pydantic-settings` - xem `app/core/config.py`.

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5555/highland_coffee` | URL async cho FastAPI |
| `SYNC_DATABASE_URL` | `postgresql+psycopg2://postgres:postgres@localhost:5555/highland_coffee` | URL sync cho Alembic & seed |
| `SECRET_KEY` | (bắt buộc) | Khóa ký JWT — **≥ 32 ký tự**, app **không khởi động** nếu thiếu / quá ngắn / còn placeholder |
| `ALGORITHM` | `HS256` | Thuật toán JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Thời hạn token (phút) |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:5173", ...]` | Danh sách origin được phép |
| `LOGIN_MAX_ATTEMPTS` | `5` | Số lần đăng nhập sai tối đa trong cửa sổ thời gian |
| `LOGIN_RATE_LIMIT_WINDOW_SECONDS` | `300` | Độ dài cửa sổ thời gian (giây) |
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
│   │   ├── config.py           # Settings (pydantic-settings) + fail-fast SECRET_KEY
│   │   ├── security.py         # bcrypt hash + JWT encode/decode + dummy hash
│   │   └── rate_limit.py       # SlidingWindowRateLimiter cho login
│   ├── crud/                   # placeholder (rỗng) — truy vấn nằm trong route
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
│   ├── conftest.py             # TestClient fixture (session scope) + cleanup
│   ├── test_auth.py            # register / login / me / rate-limit / 401
│   ├── test_products.py
│   ├── test_categories.py      # admin CRUD + xóa danh mục còn sản phẩm → 400
│   ├── test_orders.py          # cart + order flow + state machine + phân trang
│   └── test_constraints.py     # DB CHECK constraints
├── alembic.ini
├── pyproject.toml              # Cấu hình ruff + pytest
└── requirements.txt
```

---

## API Endpoints

Tất cả endpoint nằm dưới prefix `/api`.

### Auth - `/api/auth`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/register` | - | Đăng ký tài khoản customer (201) |
| POST | `/login` | - | Trả về `access_token` + `token_type` + thông tin user |
| GET | `/me` | Bearer | Thông tin user hiện tại |
| PUT | `/me` | Bearer | Cập nhật `full_name`, `phone` |

Response của `POST /login`:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": 2, "email": "customer@highland.vn", "full_name": "Nguyễn Văn Khách", "role": "customer", "...": "..." }
}
```

Quy tắc xác thực:

- Mật khẩu ≥ 8 ký tự và phải có cả chữ cái và chữ số → sai thì **422**.
- Email được chuẩn hoá về lowercase ở cả register và login.
- Vượt `LOGIN_MAX_ATTEMPTS` lần sai trong cửa sổ thời gian → **429**.
- Token hợp lệ nhưng user đã bị xoá → **401** (không phải 404).
- Thiếu / sai token → **401**. Token hợp lệ nhưng không phải admin → **403**.

### Categories - `/api/categories`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `""` | - | Danh sách danh mục |
| GET | `/{id}` | - | Chi tiết danh mục |
| POST | `""` | Admin | Tạo danh mục (201) |
| PUT | `/{id}` | Admin | Cập nhật danh mục |
| DELETE | `/{id}` | Admin | Xóa danh mục (204) |

> Xóa danh mục còn sản phẩm trả **400** (FK `RESTRICT`), không phải 500.

### Products - `/api/products`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `""` | - | Danh sách + tìm kiếm + lọc + phân trang |
| GET | `/{id}` | - | Chi tiết sản phẩm |
| POST | `""` | Admin | Tạo sản phẩm (201) |
| PUT | `/{id}` | Admin | Cập nhật sản phẩm |
| DELETE | `/{id}` | Admin | Soft delete: đặt `is_available = false` |

Query params của `GET /api/products`:

| Param | Kiểu | Mặc định | Mô tả |
|-------|------|----------|-------|
| `q` | string | - | Tìm trong `name` / `description` (ILIKE) |
| `category_id` | int | - | Lọc theo danh mục |
| `min_price` | int | - | Giá tối thiểu (VND) |
| `max_price` | int | - | Giá tối đa (VND) |
| `available_only` | bool | `true` | Chỉ lấy sản phẩm đang bán |
| `page` | int | `1` | Trang hiện tại |
| `size` | int | `12` | Số item/trang (1-100) |

Response: `{ items, total, page, size, total_pages }`.

### Cart - `/api/cart` (Bearer bắt buộc)

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/items` | Giỏ hàng hiện tại |
| POST | `/items` | Thêm sản phẩm (đã có thì cộng dồn số lượng) - 201 |
| PATCH | `/items/{item_id}` | Đổi số lượng |
| DELETE | `/items/{item_id}` | Xóa một item |
| DELETE | `/items` | Xóa toàn bộ giỏ - 204 |

Mọi response giỏ hàng có dạng `{ items, total_quantity, total_amount }`.

### Orders - `/api`

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/orders` | Bearer | Tạo đơn từ giỏ hàng (201) |
| GET | `/orders` | Bearer | Đơn của chính mình (phân trang) |
| GET | `/orders/{id}` | Bearer | Chi tiết (chủ đơn hoặc admin) |
| GET | `/admin/orders` | Admin | Tất cả đơn, lọc `?status=` (phân trang) |
| PATCH | `/admin/orders/{id}/status` | Admin | Chuyển trạng thái đơn |

Query params phân trang: `page` (mặc định `1`), `size` (mặc định `10`, tối đa `100`).

Response của `GET /orders` và `GET /admin/orders`:

```json
{ "items": [ ... ], "total": 42, "page": 1, "size": 10, "total_pages": 5 }
```

**Tạo đơn là một transaction nguyên tử:** snapshot `product_name` + `unit_price` vào `order_items`, tính `total_amount`, xóa sạch giỏ hàng. Giỏ rỗng → 400.

**State machine trạng thái đơn:**

```text
pending → confirmed → preparing → completed
   │            │             │
   └────────────┴─────────────┴──→ cancelled

completed, cancelled: trạng thái kết thúc (không chuyển tiếp)
```

Chuyển trạng thái không hợp lệ → **400**.

### Health

`GET /api/health` → `{ "status": "ok", "app": "Highlands Coffee", "version": "1.0.0" }`

---

## Database

6 bảng, quan hệ chính:

```text
users 1─n cart_items n─1 products n─1 categories
users 1─n orders 1─n order_items n─1 products
```

- Giá lưu **số nguyên VND** (vd. `49000`).
- `cart_items` cascade delete theo user và product; unique `(user_id, product_id)`.
- `orders.user_id` **nullable**, `ON DELETE SET NULL` → xóa user không mất lịch sử đơn.
- `order_items` cascade delete theo order; `RESTRICT` xóa product đang được tham chiếu (bảo toàn lịch sử đơn).
- `order_items.product_name` / `unit_price` là **snapshot** tại thời điểm đặt.
- CHECK constraints ở tầng DB: `ck_users_role`, `ck_orders_status`, `ck_products_price`, `ck_cart_items_quantity`.

Chi tiết ERD: [`../docs/erd.md`](../docs/erd.md).

### Alembic

```bash
# Áp dụng toàn bộ migration
alembic upgrade head

# Rollback 1 bước
alembic downgrade -1

# Tạo migration mới sau khi sửa model
alembic revision --autogenerate -m "mô_tả_thay_đổi"
ruff format alembic/versions      # CI yêu cầu format
alembic upgrade head
```

`alembic/env.py` đọc `SYNC_DATABASE_URL` từ `app.core.config.settings`, không cần sửa `sqlalchemy.url` trong `alembic.ini`.

---

## Kiểm thử

```bash
cd backend

pytest -q                          # toàn bộ 22 test
pytest tests/test_auth.py -v       # auth: register/login/me, rate-limit, 401
pytest tests/test_products.py -v   # products: list, search, detail, admin CRUD
pytest tests/test_categories.py -v # categories: CRUD + 400 khi còn sản phẩm
pytest tests/test_orders.py -v     # cart + order flow, state machine, phân trang
pytest tests/test_constraints.py -v # DB CHECK constraints
```

> Test dùng `TestClient` kết nối **database thật** (không dùng SQLite in-memory), nên cần `alembic upgrade head` và `python -m app.seed` trước khi chạy. Đây cũng chính là thứ tự CI chạy.

---

## Lint

```bash
cd backend
ruff check .          # kiểm tra
ruff check . --fix    # tự sửa lỗi an toàn
ruff format .         # format code
ruff format --check . # kiểm tra format (CI dùng lệnh này)
```

Cấu hình ruff trong `pyproject.toml`: line-length 100, rules `E,F,I,W` (bỏ qua `E501`).

---

## Quy ước code

- **SQLAlchemy 2.0**: dùng `Mapped[T]` + `mapped_column`, truy vấn bằng `await db.execute(select(...))` - **không** dùng `db.query()`.
- **Pydantic v2**: `model_config = ConfigDict(from_attributes=True)`, dùng `pattern=` (không dùng `regex=`).
- **Async toàn tuyến** trong routes; engine async dùng `NullPool`.
- Mật khẩu luôn hash bằng bcrypt (`app/core/security.py`), không bao giờ trả `password_hash` ra response.
- Lỗi trả về qua `HTTPException` với `status_code` và `detail` rõ ràng.
- **Không có CRUD layer**: truy vấn nằm trực tiếp trong route handler (`app/crud/` là package rỗng).

---

## Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Cách khắc phục |
|-------------|------------------------|----------------|
| `connection refused` port 5555 | Postgres chưa chạy | `docker compose up -d` |
| Login seed trả 401 | Chưa seed | `python -m app.seed` |
| Test sản phẩm fail vì danh sách rỗng | DB trống | `alembic upgrade head` + `python -m app.seed` |
| App không khởi động, báo `SECRET_KEY` | Thiếu / quá ngắn / placeholder | Set `SECRET_KEY` ≥ 32 ký tự trong `backend/.env` |
| `ModuleNotFoundError: app` | Chạy sai thư mục | Chạy lệnh trong `backend/` |
| Alembic không thấy model mới | Chưa import model | Thêm vào `app/models/__init__.py` |
| `Fatal error in launcher: Unable to create process using "...\.venv\Scripts\python.exe"` | Venv đã bị **di chuyển/sang copy** sang path khác; các launcher `.exe` (uvicorn, alembic, pytest, ruff, pip) hardcode absolute path cũ | Regenerate launcher: `python -m pip install --force-reinstall --no-deps -r requirements.txt` rồi `python -m ensurepip --upgrade` (nếu `pip.exe` hỏng: copy `pip3.exe` → `pip.exe`). Cách nhanh tạm thời: dùng `python -m uvicorn app.main:app --reload --port 8000` |
| `uvicorn` chạy nhưng báo `SECRET_KEY` thiếu | Chưa có `backend/.env` | `cp .env.example .env` rồi set `SECRET_KEY` ≥ 32 ký tự |

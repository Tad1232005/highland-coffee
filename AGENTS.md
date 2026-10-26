# Highland Coffee — AI Agent Guidelines

> **Single source of truth.** `CLAUDE.md` and `.github/copilot-instructions.md` only point here.
> Update this file when the stack, commands, conventions, or known issues change.

---

## 1. Project Overview

E-commerce web app for ordering drinks/food in the style of Highlands Coffee.

- **Backend**: FastAPI REST API at `/api`, JWT auth, async SQLAlchemy.
- **Database**: PostgreSQL 16 (Docker), 6 tables.
- **Frontend**: React 19 + Vite 8 SPA. **Business UI implemented** (khách + admin), chạy mock data mặc định (`VITE_USE_MOCK=true`).
- **CI**: GitHub Actions (backend lint/format/migrate/seed/test + frontend lint/build/test).

---

## 2. Tech Stack (verified versions)

| Layer | Technology | Version |
|---|---|---|
| Backend | Python | 3.12.6 |
| | FastAPI | 0.146.0 |
| | Uvicorn | 0.54.0 |
| | SQLAlchemy (`[asyncio]`) | 2.1.5 |
| | Alembic | 1.20.0 |
| | Pydantic / pydantic-settings | 2.14.1 / 2.16.0 |
| | asyncpg / psycopg2-binary | 0.32.0 / 2.9.13 |
| | passlib / bcrypt | 1.7.4 / 4.0.1 (bcrypt pinned) |
| | python-jose | 3.5.0 |
| | pytest / pytest-asyncio | 9.1.1 / 1.4.0 |
| | httpx | 0.28.1 |
| | Ruff | 0.17.1 |
| Database | PostgreSQL | 16 (Alpine) |
| Frontend | Node.js | 20+ (CI: 20, local: 24) |
| | React / ReactDOM | 19.3.1 |
| | react-router-dom | 7.18.4 |
| | Axios | 1.20.0 |
| | Vite | 8.3.4 |
| | ESLint | 10.13.0 (flat config) |
| | Vitest / Testing Library / jsdom | 2.1.9 / 16.3.3 / 24.1.3 |

> Vite 8 and ESLint 10 require **Node >= 20.19**. Use Node 20.19+, 22.13+, or 24.

---

## 3. Environment Files (IMPORTANT)

There are **three** env files with different consumers:

| File | Consumer | Purpose |
|---|---|---|
| `.env` (repo root) | `docker-compose.yml` | `POSTGRES_USER/PASSWORD/DB/PORT` |
| `backend/.env` | FastAPI / Alembic / seed | DB URLs, JWT, CORS, initial admin |
| `frontend/.env` | Vite | `VITE_API_BASE_URL` |

`backend/app/core/config.py` resolves `backend/.env` by absolute path from `__file__`, so it works regardless of the current working directory. Root `.env` is **not** read by the backend.

`.env.example` files are committed templates with safe defaults. `.env` files are local, gitignored copies that each developer may customize (ports, passwords, secrets) without touching the repo. The contents are identical right after copying; the separation exists so secrets never enter Git.

```bash
# Root (docker compose) — OPTIONAL: compose falls back to the same defaults
cp .env.example .env

# Backend — REQUIRED
cp backend/.env.example backend/.env

# Frontend — OPTIONAL (defaults to http://localhost:8000/api)
cp frontend/.env.example frontend/.env
```

---

## 4. Commands

### Database (repo root)
```bash
docker compose up -d
docker compose down
```

### Backend (`cd backend`)
```bash
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows
# source .venv/bin/activate         # macOS/Linux
pip install -r requirements.txt

alembic upgrade head
alembic downgrade -1
alembic revision --autogenerate -m "<name>"
python -m app.seed

uvicorn app.main:app --reload --port 8000

pytest -q
pytest tests/test_auth.py -v
ruff check .
ruff format --check .
ruff format .
```

> **Venv path is machine-specific.** The console-script launchers (`uvicorn.exe`, `alembic.exe`,
> `pytest.exe`, `ruff.exe`, `pip.exe`) embed an absolute path to the venv's `python.exe`.
> If the repo is moved/copied to another directory, every launcher dies with
> `Fatal error in launcher: Unable to create process using "...\.venv\Scripts\python.exe"`.
> Fix: `python -m pip install --force-reinstall --no-deps -r requirements.txt` then
> `python -m ensurepip --upgrade` (if `pip.exe` is still stale, copy `pip3.exe` over it).
> Workaround without reinstalling: `python -m uvicorn app.main:app --reload --port 8000`.

> **Agent/automation shells do not inherit your activated venv.** Tools such as OpenCode spawn a
> fresh `powershell -NoLogo -NoProfile -NonInteractive -Command ...` for every command, inheriting the
> environment of the background server (not your terminal). If that environment has no venv — or a
> stale `VIRTUAL_ENV` pointing at an old checkout — `python` resolves to the system interpreter and
> `pytest` / `ruff` / `alembic` are missing from `PATH`. Call the venv interpreter explicitly:
> ```powershell
> cd backend
> .\.venv\Scripts\python.exe -m pytest -q
> .\.venv\Scripts\python.exe -m ruff check .
> .\.venv\Scripts\python.exe -m alembic upgrade head
> .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
> ```
> (`python -m <tool>` bypasses the venv's console-script launchers, so it also survives a repo move.)

### Frontend (`cd frontend`)
```bash
npm ci
npm run dev        # http://localhost:5173
npm run lint       # ESLint
npm run test       # Vitest (jsdom)
npm run build      # dist/
npm run preview
```

### Docker (standalone images)
```bash
docker build -t highland-backend ./backend
docker build -t highland-frontend ./frontend
```

---

## 5. Directory Structure

```text
HighlandCF/
├── .github/
│   ├── workflows/ci.yml
│   └── copilot-instructions.md      # -> points to AGENTS.md
├── .gitattributes                   # LF normalization
├── .vscode/extensions.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/              # auth, categories, products, cart, orders
│   │   │   ├── deps.py              # get_db, get_current_user, require_admin
│   │   │   └── api.py               # router aggregation, prefix /api
│   │   ├── core/
│   │   │   ├── config.py            # Settings (reads backend/.env), fail-fast SECRET_KEY
│   │   │   ├── security.py          # bcrypt + JWT + dummy hash
│   │   │   └── rate_limit.py        # SlidingWindowRateLimiter (login throttle)
│   │   ├── crud/                    # PLACEHOLDER (empty package)
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── session.py           # async engine (NullPool) + sync engine
│   │   ├── models/                  # User, Category, Product, CartItem, Order, OrderItem
│   │   ├── schemas/                 # Pydantic v2
│   │   ├── main.py                  # app + CORS + /api/health
│   │   └── seed.py                  # admin, customer, 4 categories, 18 products
│   ├── alembic/                     # migrations
│   ├── tests/                       # conftest + 5 test modules (26 tests)
│   ├── Dockerfile
│   ├── README.md
│   ├── pyproject.toml               # ruff + pytest config
│   └── requirements.txt             # exact pins
├── frontend/
│   ├── src/
│   │   ├── api/                # client.js (Axios + mock switch), index.js (services), session.js, errors.js
│   │   ├── components/         # Header, Footer, ProductCard, PhinDrip, StatusBadge, Modal, Toast/Confirm provider, AccountMenu
│   │   ├── content/            # site.js (brand info), orders.js (status machine)
│   │   ├── context/            # AuthProvider, CartProvider, Toast/Confirm (+ useAuth/useCart/useToast/useConfirm)
│   │   ├── hooks/              # useAsyncData.js (tải dữ liệu + reload), useLogout.js (logout + confirm)
│   │   ├── mock/               # data.js + adapter.js (REST giả lập mirror backend)
│   │   ├── pages/              # Home, Menu, ProductDetail, Cart, Checkout, MyOrders, Login, Register, NotFound
│   │   │   └── admin/          # AdminLayout, AdminLogin, AdminOrders, AdminProducts, AdminCategories
│   │   ├── routes/index.jsx    # React Router 7 + RequireAuth / RequireAdmin
│   │   ├── styles/             # hero.css (hero + phin rơi), pages.css (style cấp trang)
│   │   ├── utils/format.js     # formatPrice, formatDate, slugify, normalizeSearch
│   │   ├── App.jsx             # BrowserRouter + providers (Toast > Confirm > Auth > Cart)
│   │   ├── App.test.jsx        # smoke test
│   │   ├── index.css           # design system (token màu/chữ/spacing + primitive)
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── README.md
│   ├── eslint.config.js
│   ├── vite.config.js          # react plugin + vitest jsdom + JSX runtime automatic
│   └── package.json
├── docs/
│   ├── architecture.md
│   └── erd.md
├── .env.example                     # root / docker-compose
├── docker-compose.yml               # PostgreSQL only
├── AGENTS.md                        # this file
├── CLAUDE.md                        # -> points here
└── README.md
```

---

## 6. Architecture

### Request flow
`main.py` mounts `api_router` at `/api`. Routes depend on `get_db` (AsyncSession per request) and, when protected, `get_current_user` / `require_admin` (JWT Bearer).

### API surface

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET/PUT /auth/me` |
| Categories | `GET /categories`, `GET /categories/{id}`, `POST/PUT/DELETE` (admin) |
| Products | `GET /products` (q, category_id, min/max price, page/size), `GET /products/{id}`, `POST/PUT/DELETE` (admin; DELETE = soft delete), `DELETE /products/{id}/permanent` (admin; chỉ món đã ẩn và không có lịch sử đơn) |
| Cart | `GET/POST /cart/items`, `PATCH/DELETE /cart/items/{id}`, `DELETE /cart/items` (auth) |
| Orders | `POST/GET /orders`, `GET /orders/{id}`, `GET /admin/orders`, `PATCH /admin/orders/{id}/status`, `GET /admin/analytics/revenue?days=7` (both list endpoints are paginated: `page`/`size`; revenue sums completed orders by order date in `Asia/Ho_Chi_Minh`) |
| Health | `GET /api/health` |

### Database
- 6 tables: `users`, `categories`, `products`, `cart_items`, `orders`, `order_items`.
- Money is **integer VND**.
- `cart_items`: cascade delete from user and product; unique `(user_id, product_id)`.
- `order_items`: cascade delete from order; `RESTRICT` on product (protects order history); `product_name`/`unit_price` are snapshots.
- `products.category_id`: `RESTRICT` — a category with products cannot be deleted.
- `orders.user_id`: **nullable**, `ON DELETE SET NULL` — deleting a user keeps their order history.
- DB-level CHECK constraints: `ck_users_role`, `ck_orders_status`, `ck_products_price`, `ck_cart_items_quantity`.
- Order status machine:
  `pending -> confirmed -> preparing -> completed`
  `pending/confirmed/preparing -> cancelled`
  `completed` and `cancelled` are terminal. Invalid transitions return **400**.

---

## 7. Conventions

### Backend
- **SQLAlchemy 2.0+ style**: `Mapped[T]`, `mapped_column`, `await db.execute(select(...))`. Never `db.query()`.
- **Pydantic v2**: `model_config = ConfigDict(from_attributes=True)`, use `pattern=`, never `regex=`.
- Never return `password_hash`; hash with bcrypt via `app/core/security.py`.
- Password policy: >= 8 chars and must contain a letter and a digit; emails are lowercased.
- Auth errors: **401** for a missing/invalid token or a token whose user no longer exists; **403** for an authenticated non-admin.
- Use `HTTPException(status_code=..., detail=...)` with explicit codes.
- Datetimes are timezone-aware (`DateTime(timezone=True)`).
- Run `ruff format` after `alembic revision --autogenerate` (CI checks formatting).

### Frontend
- JavaScript + JSX only (no TypeScript).
- Vite + React 19 + React Router 7 + Axios.
- Single Axios instance; attach `Authorization: Bearer <token>`; handle `401` by clearing the token.
- Use CSS variables from `src/index.css` (design system Highlands: `roast/porcelain/condensed/highland/lotus/ink`), style cấp trang nằm ở `src/styles/*.css`.
- Bố cục dùng chung: `.page-head` (đầu trang nội bộ: tiêu đề + mô tả + chip số liệu), `.section-head` (đầu section), `.panel` (mặt phẳng trắng), `.summary` (card tổng tiền), `.product-card` (card món). Dùng lại thay vì viết style mới cho từng trang.
- Chuyển động: dùng token `--motion-*` / `--ease-*` trong `src/index.css`. Không thêm animation vào **từng section** khi tải trang (fade-up lặp lại là dấu hiệu template); chuyển động tự phát chỉ dành cho hero. Chuyển động còn lại phải trả lời thao tác người dùng.
- `react-hooks/set-state-in-effect` là **error**: tải dữ liệu qua `src/hooks/useAsyncData.js` (loader bọc `useCallback`), không `setState` đồng bộ trong `useEffect`.
- Không dùng `window.alert` / `window.confirm`: dùng `useToast()` (`notify`) và `useConfirm()` (`await confirm({...})`).
- Thứ tự provider trong `src/App.jsx` là `BrowserRouter > ToastProvider > ConfirmProvider > AuthProvider > CartProvider` (hook `useLogout` cần Toast + Confirm nằm ngoài Auth).
- Login/Register là 2 trang riêng (`src/pages/Login.jsx`, `src/pages/Register.jsx`), dùng chung validator `src/utils/validation.js`; layout là thẻ card căn giữa (`.auth__card`), không dùng panel trượt. `AdminLogin` dùng đúng layout này (`.auth.auth--standalone`) chứ không có màn hình chia đôi riêng.
- `AdminLayout` có một nút menu duy nhất đặt đầu hàng (bên trái): `<900px` mở/đóng drawer, `>=900px` thu gọn/mở rộng rail (nhớ trong `localStorage['hc.admin-rail']`). Rail thu gọn còn 4.6rem, nhãn ẩn bằng kỹ thuật `visually-hidden` nên vẫn đọc được bằng screen reader. Drawer trượt từ trái, đóng bằng `X`/`Escape`/màn chắn, khoá cuộn nền và trả tiêu điểm về nút Menu.
- Chuỗi tiếng Việt: slug luôn tạo bằng `slugify()` và tìm kiếm so khớp không dấu bằng `normalizeSearch()` (cả hai ở `src/utils/format.js`) — không viết lại hàm trong từng trang.
- Sau mutation: danh sách lọc/phân trang phía server (đơn hàng) gọi `reload()` của `useAsyncData`; chỉ cập nhật cục bộ (`update`) khi bộ lọc chạy ở client (sản phẩm, danh mục).
- Thông báo lỗi dùng `.notice--error` + `role="alert"`; nhóm nút/chỉ số có `aria-label` phải kèm `role="group"`.
- Form không dùng attribute `required` (native validation chặn submit trước khi validate custom chạy) → dùng `noValidate` + `aria-required` + báo lỗi dưới field.
- UI khách hàng: Menu có chip lọc/reset; chi tiết món có CTA cố định trên mobile; giỏ hàng phân biệt loading/error/empty. `CartProvider` khóa mutation dùng chung, bao gồm `placeOrder`, và reset state theo tài khoản. Checkout hiển thị xác nhận từ response tạo đơn, không gọi DELETE giỏ lần hai. MyOrders phân trang 10 đơn và dùng vùng mở rộng chi tiết.

---

## 8. Testing

- 26 backend integration tests against a real PostgreSQL (no SQLite/in-memory), across
  `test_auth.py`, `test_products.py`, `test_categories.py`, `test_orders.py`, `test_constraints.py`.
- Tests require migrations + seed first:
  ```bash
  alembic upgrade head
  python -m app.seed
  pytest -q
  ```
- `tests/conftest.py`: session-scoped `TestClient`; `clean_db` autouse fixture removes test-created rows after each test (`order_items`, `orders`, `cart_items`, `categories.slug LIKE 'test-%'`, `slug LIKE 'test-%'`, `email LIKE 'user_%@example.com'`) while preserving seed data.
- CI seeds the DB before running tests.
- Frontend: 6 test file / 37 test (Vitest + Testing Library, jsdom): `src/App.test.jsx` (smoke), `src/pages/Login.test.jsx`, `src/pages/Register.test.jsx`, `src/components/ConfirmProvider.test.jsx`, `src/mock/adapter.test.js`, `src/pages/UserOrdering.test.jsx` (debounce, giỏ hàng, checkout, phân trang, lỗi tải/ảnh).
- `vite.config.js` bật `test.globals = true` để Testing Library tự dọn DOM giữa các test.

---

## 9. CI (`.github/workflows/ci.yml`)

Triggers: push/PR to `main`, `master`, `dev`.

**Backend job** (Ubuntu, Python 3.12, Postgres 16 service on 5432):
`pip install` → `ruff check .` → `ruff format --check .` → `alembic upgrade head` → `python -m app.seed` → `pytest -v`.

**Frontend job** (Ubuntu, Node 20):
`npm ci` → `npm run lint` → `npm run build` → `npm run test`.

---

## 10. Known Issues & Backlog (audit results)

### High
| Area | Issue | Suggested fix | Status |
|---|---|---|---|
| Docker | No `.dockerignore`. `COPY . .` copies `backend/.env` (secrets), `.venv`, `node_modules`, `.git` into images. | Add `backend/.dockerignore` and `frontend/.dockerignore`. | Open |
| Security | `SECRET_KEY` has a hard-coded default fallback in `config.py`; a missing `.env` silently signs JWTs with a public key. | Fail fast when unset outside dev. | Fixed - `config.py` rejects empty/placeholder/<32-char keys at startup |
| API | `DELETE /categories/{id}` with existing products raises an unhandled `IntegrityError` → **500**. | Catch `IntegrityError`, return 400. | Fixed - `routes/categories.py` returns 400 |
| Deps | Only direct Python deps are pinned; transitive deps still float. | Generate a full lock (`pip freeze` / `uv lock`). | Open |
| Auth | `get_current_user` returns **404** when the token's user no longer exists. | Return 401. | Fixed - `deps.py` returns 401 + `WWW-Authenticate` |
| Frontend | Business UI đã triển khai đầy đủ (khách + admin) nhưng mới dùng mock data; chưa nối API thật trong luồng đăng nhập/đặt hàng. | Bật `VITE_USE_MOCK=false` và test lại từng luồng với backend. | Open - UI xong, còn tích hợp API thật |

### Medium
| Area | Issue | Suggested fix | Status |
|---|---|---|---|
| Domain | No stock/inventory; cart quantity is unbounded. | Add stock field + checks. | Open (deferred by design) |
| DB | `role` and `order.status` are plain `String` without CHECK/Enum. | Add `CheckConstraint` or PG Enum. | Fixed - `ck_users_role`, `ck_orders_status` (migration `8f3a1c92d4b7`) |
| DB | Deleting a user cascades and deletes their order history. | Keep orders (nullable user / soft delete). | Fixed - `orders.user_id` nullable + `ON DELETE SET NULL` |
| Typing | `phone: Mapped[str]` with `nullable=True` in `User`. | `Mapped[Optional[str]]`. | Fixed |
| API | `/orders` and `/admin/orders` return all rows (no pagination). | Add page/size. | Fixed - `OrderListResponse` envelope |
| DB | `NullPool` opens a new connection per request. | Use a pool in production. | Open |
| Auth | No login rate-limiting/lockout; password minimum is 6 chars. | Add throttling + stronger policy. | Fixed - `core/rate_limit.py` (429) + password >= 8 chars with letter & digit |
| Auth | JWT stored in `localStorage` (XSS exposure); no refresh/revocation. | Consider httpOnly cookies + refresh tokens. | Open (deferred by design) |
| Docker | Images run as root; frontend uses `vite preview`; compose does not wire backend/frontend. | Non-root user, production server, compose services. | Open |
| Code | Redundant `Order.id == Order.id` in `get_my_orders` (`orders.py`). | Remove. | Fixed |
| Tests | `pytest-asyncio` is installed and `asyncio_mode=auto`, but all tests are sync. | Remove plugin or add async tests. | Open |
| Docs | README says SQLAlchemy 2.0 / React Router v6; actual 2.1.5 / v7. | This file is authoritative. | Fixed - `backend/README.md`, `docs/architecture.md` updated |
| CI | Alembic autogenerate output is unformatted; `ruff format --check` will fail on new migrations. | Run `ruff format` after generating. | Fixed - new migration is formatted |

### Low
| Area | Issue |
|---|---|
| Deps | `passlib` 1.7.4 is unmaintained and forces `bcrypt==4.0.1`; consider `pwdlib` or direct `bcrypt`. |
| Deps | `python-jose` is less maintained than `PyJWT`. |
| Deps | `email-validator` is redundant with `pydantic[email]`. |
| QA | No type checker (mypy/pyright), no coverage threshold, no `pip-audit`/`npm audit` in CI. |
| Tooling | No `.nvmrc` or `engines`; local Node 24 vs CI Node 20. |
| Files | Empty `backend/app/crud/` and empty `backend/alembic/README`. |
| CI | Vitest temp artifacts (`vite.config.js.timestamp-*.mjs`) are not ignored. |

---

## 11. Git Workflow

- Branches: `main` (stable), `dev` (integration), `feature/<name>`, `fix/<name>`, `docs/<name>`.
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`.
- Full team PR workflow (branch protection, review, rebase, squash merge, PR checklist) is documented in `README.md`.
- Repo uses `* text=auto eol=lf`; if `git status` shows mass modification after a checkout, run:
  ```bash
  git add --renormalize .
  ```
- CI must be green before merging.

### `git fetch` — Xem thay đổi remote trước khi quyết định

`git fetch` **chỉ tải thông tin nhánh/commit từ remote về máy, KHÔNG gộp vào code local**. Dùng khi muốn kiểm tra remote có gì mới trước khi pull/merge.

```bash
# Cập nhật toàn bộ remote-tracking branches (origin/*)
git fetch origin

# Xem danh sách nhánh remote
git branch -r

# Xem commit mới trên dev chưa có ở local
git log --oneline origin/dev..dev

# Xem diff giữa local dev và remote dev
git diff origin/dev..dev
```

**So sánh nhanh:**

| Lệnh | Hành động | Code local có đổi không? |
|------|-----------|-------------------------|
| `git fetch` | Chỉ cập nhật `origin/*` | **Không** |
| `git pull` | `fetch` + `merge`/`rebase` ngay | **Có** |
| `git checkout feature/x` (sau fetch) | Tạo local branch từ `origin/feature/x` | **Có** (chuyển nhánh) |

> **Mẹo:** Chạy `git fetch` thường xuyên (vd: đầu buổi sáng, trước khi rebase) để nắm trạng thái remote mà không làm rối working tree.

### Xoá nhánh an toàn sau khi đã merge

Sau khi PR được **squash and merge** vào `dev` (hoặc `main`), xoá nhánh local và remote:

```bash
# 1. Chuyển về nhánh cơ sở (dev hoặc main)
git checkout dev
git pull origin dev

# 2. Xoá nhánh local (chỉ xoá khi đã merge; -d từ chối nếu chưa merge)
git branch -d feature/cart-checkout

# 3. Xoá nhánh trên remote (GitHub)
git push origin --delete feature/cart-checkout
```

**Hoặc gọn hơn:** dùng flag `-d` của `push` (Git 2.37+):
```bash
git push origin -d feature/cart-checkout
```

**Khi nào KHÔNG xoá được với `-d`:**
- Nhánh chưa được merge → Git bảo vệ bằng cách từ chối. Nếu **chắc chắn** muốn xoá (vd: nhánh bị abandon), dùng `-D` (force delete local) và `push origin --delete` (remote).

**Dọn dẹp remote-tracking branches cũ (optional):**
```bash
# Xoá các origin/* không còn tồn tại trên remote
git fetch -p
# hoặc
git remote prune origin
```

---

## 12. Accepted Decisions

- `bcrypt==4.0.1` is intentionally pinned for passlib compatibility.
- Root `.env` is kept for docker-compose; the backend uses `backend/.env`.
- Requirements pin direct dependencies only (full lock still pending — see backlog).
- Frontend stays JavaScript/JSX (no TypeScript) for this project scope.

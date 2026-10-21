# Highland Coffee ☕ — E-Commerce Web Application

[![CI](https://github.com/Tad1232005/highland-coffee/actions/workflows/ci.yml/badge.svg)](https://github.com/Tad1232005/highland-coffee/actions/workflows/ci.yml)

Hệ thống web đặt đồ uống trực tuyến phong cách Highlands Coffee — FastAPI + React + PostgreSQL.

📚 Tài liệu chi tiết từng phần:
- [Backend README](backend/README.md) — API, database, migration, test, lint
- [Frontend README](frontend/README.md) — cấu trúc, routing, design system, build
- [Kiến trúc hệ thống](docs/architecture.md) · [ERD](docs/erd.md)

---

## ⚡ Yêu cầu tiên quyết

Cài đặt sẵn các công cụ sau trước khi bắt đầu:

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---------|---------------------|----------|
| [Git](https://git-scm.com/) | 2.x | `git --version` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop) | 24.x | `docker --version` |
| [Python](https://www.python.org/downloads/) | 3.12+ | `python --version` |
| [Node.js](https://nodejs.org/) | 20+ | `node --version` |
| [npm](https://www.npmjs.com/) | 10+ | `npm --version` |

---

## 🚀 Cài đặt lần đầu (Local Setup)

### Bước 1 — Clone repository

```bash
git clone https://github.com/Tad1232005/highland-coffee.git
cd highland-coffee

# Làm việc trên nhánh tích hợp, không commit trực tiếp lên main
git checkout dev
```

---

### Bước 2 — Cấu hình biến môi trường

Dự án dùng **3 file env độc lập**, mỗi file phục vụ một thành phần khác nhau:

| File | Ai đọc | Bắt buộc? | Dùng để cấu hình |
|------|--------|-----------|------------------|
| `.env` (thư mục gốc) | `docker compose` | Không (có default) | User/password/database/port của container PostgreSQL |
| `backend/.env` | FastAPI, Alembic, seed script | **Có** | DB URL, JWT, CORS, tài khoản admin khởi tạo |
| `frontend/.env` | Vite | Không | `VITE_API_BASE_URL`, `VITE_USE_MOCK` |

```bash
# Backend — bắt buộc
# macOS / Linux
cp backend/.env.example backend/.env
# Windows (PowerShell)
Copy-Item backend/.env.example backend/.env

# Root — tùy chọn, chỉ cần khi muốn đổi user/password/port của Postgres
cp .env.example .env

# Frontend — tùy chọn, chỉ cần khi API không chạy ở http://localhost:8000
cp frontend/.env.example frontend/.env
```

> **Lưu ý:** Các file `.env` đã có đủ giá trị mặc định để chạy local. Không cần chỉnh sửa gì thêm.

#### `.env.example` và `.env` khác nhau ở đâu?

- **`.env.example`** là template được commit lên Git, chứa giá trị mặc định an toàn và **không có bí mật thật**. Ai clone repo cũng thấy file này.
- **`.env`** là bản sao local, **bị `.gitignore`**, dùng để mỗi thành viên tự chỉnh cấu hình riêng (port bị chiếm, password riêng, secret riêng) mà không ảnh hưởng người khác và không vô tình đẩy bí mật lên GitHub.
- Nội dung hai file **giống nhau ngay sau khi copy** — đó là mục đích của template. Bạn chỉ cần copy **một lần**, sau đó sửa `.env` nếu môi trường của bạn khác mặc định.
- **`.env` ở root KHÔNG được backend đọc.** Backend đọc `backend/.env` (đường dẫn tuyệt đối trong `config.py`). Root `.env` chỉ để `docker-compose.yml` lấy các biến `POSTGRES_*`.

> Nếu không tạo `.env` ở root, `docker compose` vẫn chạy với giá trị mặc định:
> user/password `postgres`, database `highland_coffee`, port `5555`.
>
> Nếu đổi `POSTGRES_PORT` ở root `.env`, phải đổi đồng thời `POSTGRES_PORT` và hai URL `DATABASE_URL` / `SYNC_DATABASE_URL` trong `backend/.env` cho khớp.

---

### Bước 3 — Khởi động cơ sở dữ liệu PostgreSQL

```bash
docker compose up -d
```

Kiểm tra container đang chạy:
```bash
docker ps
```

Bạn sẽ thấy container `highland_coffee_postgres` có trạng thái `healthy` trên **port 5555**.

---

### Bước 4 — Thiết lập Backend

```bash
cd backend

# 1. Tạo và kích hoạt môi trường ảo Python
python -m venv .venv

# Windows (PowerShell):
.venv\Scripts\Activate.ps1

# macOS / Linux:
# source .venv/bin/activate

# 2. Cài đặt thư viện
pip install -r requirements.txt

# 3. Chạy database migration
alembic upgrade head

# 4. Seed dữ liệu mẫu (Admin, 4 danh mục, 18 sản phẩm)
python -m app.seed

# 5. Khởi động server FastAPI
uvicorn app.main:app --reload --port 8000
```

✅ Backend sẽ chạy tại: `http://localhost:8000`
📖 API Docs (Swagger UI): `http://localhost:8000/docs`

---

### Bước 5 — Thiết lập Frontend

Mở **terminal mới** tại thư mục gốc của dự án:

```bash
cd frontend

# 1. Cài đặt các thư viện Node.js (dùng lockfile để đảm bảo đúng phiên bản)
npm ci

# 2. Khởi động Vite dev server
npm run dev
```

✅ Frontend sẽ chạy tại: `http://localhost:5173`
> **Chế độ demo không cần backend:** `frontend/.env` mặc định `VITE_USE_MOCK=true`, frontend dùng dữ liệu giả lập trong `src/mock/`.
> Khi muốn gọi API thật, đặt `VITE_USE_MOCK=false` (backend phải chạy tại `http://localhost:8000`).
> Tài khoản demo ở chế độ mock: `admin@highland.vn` / `Admin@123456`, `customer@highland.vn` / `Customer@123456`.

---

## 🔑 Tài khoản mặc định (sau khi seed)

| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| **Admin** | `admin@highland.vn` | `Admin@123456` |
| **Customer** | `customer@highland.vn` | `Customer@123456` |

> ⚠️ **Không sử dụng mật khẩu mẫu này khi deploy lên môi trường production.**

---

## 🗄️ Kết nối pgAdmin (tùy chọn)

Nếu muốn xem dữ liệu trực quan qua pgAdmin:

- **Host:** `localhost`
- **Port:** `5555`
- **Database:** `highland_coffee`
- **Username:** `postgres`
- **Password:** `postgres`

---

## 🧪 Chạy kiểm thử

```bash
cd backend

# Chạy toàn bộ 22 test cases
pytest -v

# Chạy riêng từng module
pytest tests/test_auth.py -v
pytest tests/test_orders.py -v
pytest tests/test_products.py -v
pytest tests/test_categories.py -v
pytest tests/test_constraints.py -v
```

---

## 🔍 Lint & Kiểm tra code style

```bash
# Backend (ruff)
cd backend
.venv\Scripts\ruff check .        # Windows
# source .venv/bin/activate && ruff check .  # macOS/Linux

# Frontend (eslint)
cd frontend
npm run lint
```

---

## 📋 Lệnh tham khảo nhanh

```bash
# Khởi động PostgreSQL
docker compose up -d

# Dừng PostgreSQL
docker compose down

# Tạo migration mới sau khi thay đổi model
cd backend
alembic revision --autogenerate -m "mô_tả_thay_đổi"
alembic upgrade head

# Rollback 1 migration
alembic downgrade -1

# Build frontend production
cd frontend
npm run build
```

---

## 📁 Cấu trúc thư mục

```text
highland-coffee/
├── .github/
│   ├── workflows/ci.yml          # GitHub Actions CI Pipeline
│   └── copilot-instructions.md  # Hướng dẫn cho GitHub Copilot
├── backend/
│   ├── app/
│   │   ├── api/routes/           # Auth, Categories, Products, Cart, Orders, Admin
│   │   ├── api/deps.py           # Dependencies: get_db, get_current_user, require_admin
│   │   ├── core/                 # config.py, security.py (JWT + bcrypt), rate_limit.py (login throttle)
│   │   ├── db/                   # base.py, session.py (async + sync engine)
│   │   ├── models/               # User, Category, Product, CartItem, Order, OrderItem
│   │   ├── schemas/              # Pydantic v2 schemas
│   │   ├── main.py               # FastAPI app + CORS
│   │   └── seed.py               # Script seed dữ liệu mẫu
│   ├── alembic/                  # Database migrations
│   ├── tests/                    # pytest: test_auth, test_orders, test_products, test_categories, test_constraints
│   ├── .env.example              # Template env backend
│   ├── Dockerfile
│   ├── pyproject.toml            # Cấu hình ruff + pytest
│   ├── alembic.ini
│   ├── README.md                 # Tài liệu backend chi tiết
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client + services + mock switch
│   │   ├── components/        # Header, Footer, ProductCard, PhinDrip, Modal, Toast/Confirm, ...
│   │   ├── content/           # site.js, orders.js
│   │   ├── context/           # AuthProvider, CartProvider, Toast/Confirm
│   │   ├── hooks/             # useAsyncData.js, useLogout.js
│   │   ├── mock/              # data.js + adapter.js (mock REST)
│   │   ├── pages/             # Home, Menu, Cart, Checkout, ... + admin/
│   │   ├── routes/            # index.jsx (RequireAuth / RequireAdmin)
│   │   ├── styles/            # hero.css, pages.css
│   │   ├── App.jsx            # BrowserRouter + providers
│   │   ├── App.test.jsx       # Vitest smoke test
│   │   └── index.css          # Design system Highlands
│   ├── .env.example              # Template env frontend
│   ├── Dockerfile
│   ├── eslint.config.js          # ESLint configuration
│   ├── package.json
│   ├── README.md                 # Tài liệu frontend chi tiết
│   └── vite.config.js
├── docs/
│   ├── architecture.md           # Mô tả kiến trúc hệ thống
│   └── erd.md                    # Entity Relationship Diagram (ERD)
├── .env.example                  # Template env cho docker compose
├── .gitignore
├── docker-compose.yml            # PostgreSQL 16 service
├── AGENTS.md                     # Single source of truth cho AI agent
├── CLAUDE.md                     # Pointer tới AGENTS.md
└── README.md
```

---

## 🔀 Quy trình làm việc nhóm trên GitHub

### Mô hình nhánh

| Nhánh | Mục đích | Ai được push/merge |
|-------|----------|--------------------|
| `main` | Code ổn định, production-ready | Chỉ merge từ `dev` qua PR release |
| `dev` | Nhánh tích hợp, nhận PR từ các nhánh feature/fix | Maintainer merge PR |
| `feature/<tên>` | Một tính năng mới, tách từ `dev` | Chính người làm |
| `fix/<tên>` | Sửa bug, tách từ `dev` | Chính người làm |
| `docs/<tên>` | Cập nhật tài liệu | Chính người làm |

**Quy tắc chung:**
- **Không push trực tiếp lên `main` và `dev`.** Mọi thay đổi đi qua Pull Request.
- Mỗi nhánh chỉ giải quyết **một mục đích**, không gộp nhiều tính năng.
- Bật **branch protection** cho `main` và `dev`: require PR + require status checks (backend, frontend) + không cho force push.
  Thiết lập tại **GitHub → Settings → Branches → Add branch protection rule**.

### Bắt đầu một task

```bash
# Luôn cập nhật dev mới nhất trước khi tạo nhánh
git checkout dev
git pull origin dev

# Tạo nhánh làm việc
git checkout -b feature/cart-checkout
```

### Commit

```bash
git add <file-cụ-thể>       # tránh git add -A nếu có file rác
git commit -m "feat: thêm trang giỏ hàng"
```

**Commit message theo [Conventional Commits](https://www.conventionalcommits.org/):**

```
feat:     Thêm tính năng mới
fix:      Sửa lỗi
docs:     Cập nhật tài liệu
refactor: Refactor code (không thay đổi chức năng)
test:     Thêm hoặc sửa test
chore:    Cập nhật config, deps, CI...
ci:       Thay đổi GitHub Actions
```

- Commit nhỏ, mỗi commit một ý rõ ràng.
- **Không commit** `.env`, `.venv/`, `node_modules/`, `dist/`, file database hay bất kỳ bí mật nào.

### Push và mở Pull Request

```bash
git push -u origin feature/cart-checkout
```

1. Mở PR với **base là `dev`** (không phải `main`).
2. Tiêu đề PR theo Conventional Commits; mô tả gồm: **làm gì / vì sao / cách kiểm tra**.
3. Gắn reviewer và tự review lại diff trước khi nhờ người khác.
4. Chờ **CI xanh** (backend + frontend). CI đỏ thì chưa được merge.

```bash
# Xem nhanh thay đổi của mình so với dev
git fetch origin
git log --oneline origin/dev..HEAD
git diff origin/dev...HEAD
```

### Review và merge

- Cần **ít nhất 1 approve** (với nhóm từ 2 người trở lên).
- Giải quyết hết comment/conflict trước khi merge.
- Dùng **Squash and merge** để lịch sử `dev` gọn (1 PR = 1 commit).
- Xoá nhánh feature sau khi merge.
- Phát hành: tạo PR riêng **`dev` → `main`**, chỉ merge khi CI xanh và đã kiểm tra.

### Đồng bộ nhánh với `dev`

Khi `dev` có thay đổi mới trong lúc bạn đang làm:

```bash
git checkout dev
git pull origin dev
git checkout feature/cart-checkout
git rebase dev

# Giải quyết conflict (nếu có), chạy lại test, rồi:
git push --force-with-lease
```

> Dùng `--force-with-lease`, **không dùng `--force`**. Không rebase nhánh của người khác khi chưa thống nhất.

### Checklist trước khi mở PR

- [ ] Đã pull `dev` mới nhất và rebase/merge vào nhánh của mình.
- [ ] Trong `backend/`: `pytest -q` chạy qua.
- [ ] Trong `backend/`: `ruff check .` và `ruff format --check .` chạy qua.
- [ ] Trong `frontend/`: `npm run lint`, `npm run test`, `npm run build` chạy qua.
- [ ] Diff không chứa `.env`, bí mật, `node_modules`, `.venv`, file build.
- [ ] Đã cập nhật `README.md` / `AGENTS.md` nếu thay đổi command, stack hoặc quy ước.
- [ ] PR nhỏ, dễ review; mô tả rõ cách test.

### Khi CI đỏ

1. Vào tab **Actions** trên GitHub → chọn job lỗi → đọc log.
2. Reproduce ở local bằng đúng lệnh trong workflow.
3. Sửa và tạo commit mới (không `amend` nếu commit đã push và đang được review).
4. Push lại; CI sẽ tự chạy lại trên PR.

> CI chạy: backend (`ruff check` → `ruff format --check` → `alembic upgrade head` → `python -m app.seed` → `pytest`) và frontend (`npm ci` → `npm run lint` → `npm run build` → `npm run test`).

---

## 📐 Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.1, Alembic, Pydantic v2 |
| Auth | JWT (python-jose), Bcrypt (passlib) |
| Database | PostgreSQL 16 (Docker) |
| Frontend | Node 20+, React 19, Vite 8, React Router 7, Axios |
| Lint | Ruff (backend), ESLint (frontend) |
| Tests | Pytest + FastAPI TestClient (backend), Vitest + Testing Library (frontend) |
| CI/CD | GitHub Actions |

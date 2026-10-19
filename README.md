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
```

---

### Bước 2 — Cấu hình biến môi trường

```bash
# Windows (PowerShell)
Copy-Item backend/.env.example backend/.env

# macOS / Linux
cp backend/.env.example backend/.env
```

> **Lưu ý:** File `.env` đã có đủ giá trị mặc định để chạy local. Không cần chỉnh sửa gì thêm.

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

# 1. Cài đặt các thư viện Node.js
npm install

# 2. Khởi động Vite dev server
npm run dev
```

✅ Frontend sẽ chạy tại: `http://localhost:5173`

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

# Chạy toàn bộ 9 test cases
pytest -v

# Chạy riêng từng module
pytest tests/test_auth.py -v
pytest tests/test_orders.py -v
pytest tests/test_products.py -v
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
│   │   ├── core/                 # config.py, security.py (JWT + bcrypt)
│   │   ├── db/                   # base.py, session.py (async + sync engine)
│   │   ├── models/               # User, Category, Product, CartItem, Order, OrderItem
│   │   ├── schemas/              # Pydantic v2 schemas
│   │   ├── main.py               # FastAPI app + CORS
│   │   └── seed.py               # Script seed dữ liệu mẫu
│   ├── alembic/                  # Database migrations
│   ├── tests/                    # pytest: test_auth, test_orders, test_products
│   ├── pyproject.toml            # Cấu hình ruff + pytest
│   ├── alembic.ini
│   ├── README.md                 # Tài liệu backend chi tiết
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios client và service modules
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # AuthContext, CartContext
│   │   ├── pages/                # Các trang: Home, Menu, Cart, Checkout...
│   │   └── routes/               # React Router + ProtectedRoute/AdminRoute
│   ├── eslint.config.js          # ESLint configuration
│   ├── package.json
│   ├── README.md                 # Tài liệu frontend chi tiết
│   └── vite.config.js
├── docs/
│   ├── architecture.md           # Mô tả kiến trúc hệ thống
│   └── erd.md                    # Entity Relationship Diagram (ERD)
├── .env.example                  # Template biến môi trường
├── .gitignore
├── docker-compose.yml            # PostgreSQL 16 service
├── AGENTS.md                     # Hướng dẫn cho AI agent (Antigravity, Claude...)
├── CLAUDE.md                     # Hướng dẫn cho Claude AI
└── README.md
```

---

## 🔀 Quy ước nhánh Git

| Nhánh | Mục đích |
|-------|----------|
| `main` | Code đã ổn định, production-ready |
| `dev` | Nhánh phát triển chính, merge feature vào đây |
| `feature/tên-tính-năng` | Mỗi tính năng mới tạo nhánh riêng từ `dev` |

**Commit message theo [Conventional Commits](https://www.conventionalcommits.org/):**
```
feat:     Thêm tính năng mới
fix:      Sửa lỗi
docs:     Cập nhật tài liệu
refactor: Refactor code (không thay đổi chức năng)
test:     Thêm hoặc sửa test
chore:    Cập nhật config, deps, CI...
```

---

## 🤝 Đóng góp

1. Fork hoặc clone repo
2. Tạo nhánh từ `dev`: `git checkout -b feature/tên-tính-năng dev`
3. Commit theo Conventional Commits
4. Mở Pull Request target vào nhánh `dev`
5. CI phải xanh hoàn toàn trước khi merge

---

## 📐 Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| Auth | JWT (python-jose), Bcrypt (passlib) |
| Database | PostgreSQL 16 (Docker) |
| Frontend | React 19, Vite 8, React Router v6, Axios |
| Lint | Ruff (backend), ESLint (frontend) |
| Tests | Pytest, FastAPI TestClient |
| CI/CD | GitHub Actions |

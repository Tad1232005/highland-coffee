# Highland Coffee - E-Commerce Web Application

Hệ thống web đặt đồ uống trực tuyến phong cách Highlands Coffee với giao diện hiện đại và kiến trúc tách biệt Frontend - Backend chuẩn mực.

---

## 🛠 Tech Stack

- **Backend**:
  - Python 3.12+ / FastAPI
  - PostgreSQL 16 (chạy qua Docker Compose)
  - SQLAlchemy 2.0 (Async/Sync ORM)
  - Alembic (Database Migrations)
  - Pydantic v2 (Validation & Settings)
  - Passlib (Bcrypt) + Python-JOSE (JWT Authentication)
- **Frontend**:
  - React 18 / 19 with Vite (JavaScript)
  - React Router DOM
  - Axios (HTTP Client với interceptor token)
  - Custom CSS Design System (Highlands Red & Gold theme, responsive, UX cao cấp)
- **DevOps & Tooling**:
  - Docker & Docker Compose
  - Pytest (Backend tests)

---

## 📁 Cấu Trúc Thư Mục

```text
HighlandCF/
├── .github/
│   └── copilot-instructions.md
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/        # Router endpoints (/auth, /categories, /products, /cart, /orders, /admin)
│   │   │   └── deps.py        # Dependencies (get_db, get_current_user, require_admin)
│   │   ├── core/              # Config (pydantic-settings), Security (JWT, bcrypt)
│   │   ├── crud/              # Data Access Layer / Business logic
│   │   ├── db/                # Database engine, session maker, base model
│   │   ├── models/            # SQLAlchemy 2.0 models (User, Category, Product, CartItem, Order, OrderItem)
│   │   ├── schemas/           # Pydantic v2 schemas (requests, responses, token)
│   │   ├── main.py            # FastAPI main app, CORS middleware, router registration
│   │   └── seed.py            # Data seeder (Admin, Categories, 15+ Highlands drinks)
│   ├── alembic/               # Database migrations directory
│   ├── tests/                 # Pytest test cases (auth, orders)
│   ├── alembic.ini            # Alembic configuration
│   └── requirements.txt       # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client and API services
│   │   ├── components/        # UI components (Header, Footer, ProductCard, etc.)
│   │   ├── context/           # AuthContext, CartContext
│   │   ├── pages/             # Home, Menu, ProductDetail, Cart, Checkout, MyOrders, Login, Register, Admin...
│   │   ├── routes/            # App routes, ProtectedRoute, AdminRoute
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css          # Design system & styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/                      # Documentation
├── .env.example
├── .gitignore
├── docker-compose.yml
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Khởi động PostgreSQL Database
```bash
docker compose up -d
```
Kiểm tra trạng thái container:
```bash
docker ps
```

### 2. Thiết lập Backend

Sao chép file môi trường:
```bash
# Tại thư mục gốc
copy .env.example .env
```

Tạo và kích hoạt môi trường ảo Python:
```bash
cd backend
python -m venv .venv

# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Hoặc CMD:
# .venv\Scripts\activate.bat

# Cài đặt thư viện:
pip install -r requirements.txt
```

Chạy Database Migrations:
```bash
alembic upgrade head
```

Chạy Seed Data mẫu (Tạo Admin, Danh mục và ~15 sản phẩm Highlands):
```bash
python -m app.seed
```

Khởi chạy FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Tài khoản mặc định được seed:
- **Admin**: `admin@highland.vn` / `Admin@123456`
- **Customer**: `customer@highland.vn` / `Customer@123456`

### 3. Thiết lập Frontend

Mở terminal mới tại thư mục `frontend`:
```bash
cd frontend
npm install
npm run dev
```
Truy cập ứng dụng web tại: `http://localhost:5173`

---

## 🧪 Chạy Kiểm Thử (Tests)

Tại thư mục `backend`:
```bash
pytest
```

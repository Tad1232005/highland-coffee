# Highland Coffee - AI Agent Guidelines & Architecture

This file provides system context, stack specifications, commands, and project conventions for AI agents assisting on this project.

---

## 🛠 Tech Stack Overview

- **Backend**:
  - Python 3.12+ with FastAPI framework
  - Database: PostgreSQL 16
  - ORM: SQLAlchemy 2.0 (modern 2.0 syntax with `Mapped`, `mapped_column`, `select`)
  - Migrations: Alembic
  - Schemas & Settings: Pydantic v2 + `pydantic-settings`
  - Authentication: JWT tokens with HS256, Passlib bcrypt password hashing
  - Testing: Pytest + TestClient / httpx
- **Frontend**:
  - React 18/19 with Vite (JavaScript JSX)
  - React Router DOM v6
  - Axios HTTP client with Bearer token interceptor
  - Custom CSS Design System tailored for Highlands Coffee (Crimson Red, Gold Roast, Warm Espresso)
- **Containerization**:
  - Docker Compose for PostgreSQL 16 (`docker-compose.yml`)

---

## 💻 Commands Reference

### PostgreSQL Service
```bash
docker compose up -d
docker compose down
```

### Backend (execute inside `./backend` directory)
```bash
# Setup virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Database Migrations
alembic upgrade head
alembic downgrade -1
alembic revision --autogenerate -m "<migration_name>"

# Database Seed
python -m app.seed

# Run FastAPI Development Server
uvicorn app.main:app --reload --port 8000

# Automated Testing
pytest
```

### Frontend (execute inside `./frontend` directory)
```bash
# Install packages
npm install

# Run Vite dev server
npm run dev

# Production build
npm run build
```

---

## 📁 Directory Architecture

```text
HighlandCF/
├── .github/
│   └── copilot-instructions.md
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/        # /auth, /categories, /products, /cart, /orders, /admin
│   │   │   ├── deps.py        # get_db, get_current_user, require_admin
│   │   │   └── api.py         # main router combiner
│   │   ├── core/
│   │   │   ├── config.py      # App settings
│   │   │   └── security.py    # bcrypt & JWT
│   │   ├── crud/              # CRUD data access layer
│   │   ├── db/
│   │   │   ├── base.py        # DeclarativeBase & model imports
│   │   │   └── session.py     # sessionmaker & engines
│   │   ├── models/            # User, Category, Product, CartItem, Order, OrderItem
│   │   ├── schemas/           # Pydantic v2 request/response schemas
│   │   ├── main.py            # FastAPI entrypoint & CORS
│   │   └── seed.py            # Initial seed data
│   ├── alembic/               # Alembic version files & env.py
│   ├── tests/                 # pytest test cases
│   ├── alembic.ini
│   ├── README.md              # Backend setup, API reference, DB & testing
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/               # axios instance & API callers
│   │   ├── components/        # Navbar, Footer, Cards, Modals
│   │   ├── context/           # AuthContext, CartContext
│   │   ├── pages/             # Home, Menu, ProductDetail, Cart, Checkout, MyOrders, Login, Admin
│   │   ├── routes/            # App routes & Protected/Admin routes
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css          # Design system & theme styles
│   ├── index.html
│   ├── package.json
│   ├── README.md              # Frontend setup, structure, routing & build
│   └── vite.config.js
├── docs/                      # Project design & specs
├── .env.example
├── .gitignore
├── docker-compose.yml
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

---

## 📐 Conventions & Rules

1. **SQLAlchemy 2.0 Compliance**:
   - Explicit `Mapped[T]` on all columns.
   - Declarative base inheriting `sqlalchemy.orm.DeclarativeBase`.
   - Never use `db.query()`. Always use `db.execute(select(...))`.
2. **Pydantic v2 Compliance**:
   - `model_config = ConfigDict(from_attributes=True)`.
   - No `regex=` argument in `Field()`; use `pattern=`.
3. **Database Constraints & Schema**:
   - Integer prices in VND (e.g., 49000).
   - Cascade delete on CartItem when User is deleted.
   - Cascade delete on OrderItem when Order is deleted; restrict delete on Product referenced by OrderItem.
4. **Git Commits**:
   - Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).

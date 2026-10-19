# Highland Coffee Development Guide

This guide contains project conventions, architecture, and common commands for the Highland Coffee full-stack e-commerce project.

---

## 🛠 Tech Stack

- **Backend**:
  - Python 3.12+ / FastAPI
  - PostgreSQL 16 (via Docker Compose)
  - SQLAlchemy 2.0 (Modern Declarative Mapped, Select syntax)
  - Alembic (Database Migrations)
  - Pydantic v2 (`BaseModel`, `ConfigDict`, `field_validator`)
  - Passlib (Bcrypt) + Python-JOSE (JWT Authentication)
  - Pytest (Unit & Integration tests)
- **Frontend**:
  - React 18 / 19 with Vite (JavaScript JSX)
  - React Router v6
  - Axios (with authorization header interceptor)
  - Vanilla CSS Design System with Highlands aesthetic (Deep red, warm cream, dark roast brown, accents)

---

## 🏃 Running Commands

### 1. Database (PostgreSQL 16)
```bash
# Start PostgreSQL container
docker compose up -d

# Stop PostgreSQL container
docker compose down

# View logs
docker compose logs -f postgres
```

### 2. Backend Commands (from `./backend` folder)
```bash
# Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Create new migration
alembic revision --autogenerate -m "describe_changes"

# Seed initial admin, categories, and products
python -m app.seed

# Run dev server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest
pytest tests/test_auth.py -v
pytest tests/test_orders.py -v
```

### 3. Frontend Commands (from `./frontend` folder)
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Directory Structure

```text
HighlandCF/
├── .github/
│   └── copilot-instructions.md     # GitHub Copilot instructions
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/             # auth, categories, products, cart, orders, admin
│   │   │   ├── deps.py             # get_db, get_current_user, require_admin
│   │   │   └── api.py              # APIRouter aggregation
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic v2 BaseSettings
│   │   │   └── security.py         # Passlib bcrypt & JWT encode/decode
│   │   ├── crud/                   # CRUD operations for all entities
│   │   ├── db/
│   │   │   ├── base.py             # SQLAlchemy 2.0 DeclarativeBase
│   │   │   └── session.py          # async/sync sessionmakers
│   │   ├── models/                 # SQLAlchemy 2.0 mapped models
│   │   ├── schemas/                # Pydantic v2 schemas
│   │   ├── main.py                 # FastAPI application & CORS
│   │   └── seed.py                 # Initial database seeding script
│   ├── alembic/                    # Migration scripts
│   ├── tests/                      # Automated test suite
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                    # Axios client & service modules
│   │   ├── components/             # Reusable UI components
│   │   ├── context/                # AuthContext, CartContext
│   │   ├── pages/                  # Route views (Home, Menu, Detail, Cart, Orders, Admin...)
│   │   ├── routes/                 # Router configuration & route guards
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css               # Global theme & typography
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/                           # Architecture and API documentation
├── .env.example
├── .gitignore
├── docker-compose.yml
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

---

## 📐 Coding Conventions

### Backend (Python / FastAPI / SQLAlchemy 2.0 / Pydantic v2)
1. **SQLAlchemy 2.0 Standards**:
   - Always use `Mapped[...]` and `mapped_column(...)` for type annotations.
   - Use `select(...)` statements rather than legacy `query(...)`.
   - Relationships must specify `back_populates` and foreign key actions (`cascade="all, delete-orphan"`, `ondelete="CASCADE"`).
2. **Pydantic v2 Standards**:
   - Use `model_config = ConfigDict(from_attributes=True)` instead of `class Config: orm_mode = True`.
   - Validate field types cleanly using Python type annotations.
3. **API Design**:
   - Prefix all endpoints with `/api`.
   - Use standard HTTP status codes: `200 OK`, `201 Created`, `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`.
   - Error responses should return a consistent detail message `{ "detail": "..." }`.
4. **Security**:
   - Passwords must be hashed using bcrypt (passlib).
   - JWT tokens include `sub` (user_id), `role`, and expiration (`exp`).
   - Sensitive credentials must strictly come from `.env` via `pydantic-settings`.

### Frontend (React / Vite)
1. **Component Structure**:
   - Functional components with React hooks (`useState`, `useEffect`, `useContext`, `useMemo`).
   - Clean separation of business logic and presentation.
2. **State Management**:
   - Use `AuthContext` for user session & token storage (in `localStorage`).
   - Use `CartContext` to synchronize the active user's cart with backend cart endpoints.
3. **Styling & Design System**:
   - Use custom Vanilla CSS adhering to Highlands brand identity:
     - Primary: Deep Crimson Red (`#b22830` / `#8b1e24`)
     - Secondary: Rich Espresso Brown (`#2c1810`)
     - Accent: Golden Roast / Cream (`#d4a373` / `#fefae0` / `#faf0ca`)
     - Surface: Clean card glassmorphism with subtle shadows and micro-animations.
4. **Git Commit Messages**:
   - Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.

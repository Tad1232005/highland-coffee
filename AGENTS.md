# Highland Coffee — AI Agent Guidelines

> **Single source of truth.** `CLAUDE.md` and `.github/copilot-instructions.md` only point here.
> Update this file when the stack, commands, conventions, or known issues change.

---

## 1. Project Overview

E-commerce web app for ordering drinks/food in the style of Highlands Coffee.

- **Backend**: FastAPI REST API at `/api`, JWT auth, async SQLAlchemy.
- **Database**: PostgreSQL 16 (Docker), 6 tables.
- **Frontend**: React + Vite SPA. **Currently a scaffold** — business UI is not implemented yet.
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
│   │   │   ├── config.py            # Settings (reads backend/.env)
│   │   │   └── security.py          # bcrypt + JWT
│   │   ├── crud/                    # PLACEHOLDER (empty package)
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── session.py           # async engine (NullPool) + sync engine
│   │   ├── models/                  # User, Category, Product, CartItem, Order, OrderItem
│   │   ├── schemas/                 # Pydantic v2
│   │   ├── main.py                  # app + CORS + /api/health
│   │   └── seed.py                  # admin, customer, 4 categories, 18 products
│   ├── alembic/                     # migrations
│   ├── tests/                       # conftest + 3 test modules
│   ├── Dockerfile
│   ├── README.md
│   ├── pyproject.toml               # ruff + pytest config
│   └── requirements.txt             # exact pins
├── frontend/
│   ├── src/
│   │   ├── api/index.js             # PLACEHOLDER
│   │   ├── components/index.js      # PLACEHOLDER
│   │   ├── context/index.js         # PLACEHOLDER
│   │   ├── pages/index.js           # PLACEHOLDER
│   │   ├── routes/index.js          # PLACEHOLDER
│   │   ├── App.jsx                  # Vite starter template
│   │   ├── App.test.jsx             # smoke test
│   │   └── index.css                # Vite starter theme (not branded)
│   ├── Dockerfile
│   ├── README.md
│   ├── eslint.config.js
│   ├── vite.config.js               # react plugin + vitest jsdom
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
| Products | `GET /products` (q, category_id, min/max price, page/size), `GET /products/{id}`, `POST/PUT/DELETE` (admin; DELETE = soft delete) |
| Cart | `GET/POST /cart/items`, `PATCH/DELETE /cart/items/{id}`, `DELETE /cart/items` (auth) |
| Orders | `POST/GET /orders`, `GET /orders/{id}`, `GET /admin/orders`, `PATCH /admin/orders/{id}/status` |
| Health | `GET /api/health` |

### Database
- 6 tables: `users`, `categories`, `products`, `cart_items`, `orders`, `order_items`.
- Money is **integer VND**.
- `cart_items`: cascade delete from user and product; unique `(user_id, product_id)`.
- `order_items`: cascade delete from order; `RESTRICT` on product (protects order history); `product_name`/`unit_price` are snapshots.
- `products.category_id`: `RESTRICT` — a category with products cannot be deleted.
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
- Use `HTTPException(status_code=..., detail=...)` with explicit codes.
- Datetimes are timezone-aware (`DateTime(timezone=True)`).
- Run `ruff format` after `alembic revision --autogenerate` (CI checks formatting).

### Frontend
- JavaScript + JSX only (no TypeScript).
- Vite + React 19 + React Router 7 + Axios.
- Single Axios instance; attach `Authorization: Bearer <token>`; handle `401` by clearing the token.
- Use CSS variables from `src/index.css` (currently Vite defaults — rebrand pending).

---

## 8. Testing

- 9 backend integration tests against a real PostgreSQL (no SQLite/in-memory).
- Tests require migrations + seed first:
  ```bash
  alembic upgrade head
  python -m app.seed
  pytest -q
  ```
- `tests/conftest.py`: session-scoped `TestClient`; `clean_db` autouse fixture removes test-created rows after each test (`order_items`, `orders`, `cart_items`, `slug LIKE 'test-%'`, `email LIKE 'user_%@example.com'`) while preserving seed data.
- CI seeds the DB before running tests.
- Frontend: one Vitest smoke test (`src/App.test.jsx`).

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
| Area | Issue | Suggested fix |
|---|---|---|
| Docker | No `.dockerignore`. `COPY . .` copies `backend/.env` (secrets), `.venv`, `node_modules`, `.git` into images. | Add `backend/.dockerignore` and `frontend/.dockerignore`. |
| Security | `SECRET_KEY` has a hard-coded default fallback in `config.py`; a missing `.env` silently signs JWTs with a public key. | Fail fast when unset outside dev. |
| API | `DELETE /categories/{id}` with existing products raises an unhandled `IntegrityError` → **500**. | Catch `IntegrityError`, return 400. |
| Deps | Only direct Python deps are pinned; transitive deps still float. | Generate a full lock (`pip freeze` / `uv lock`). |
| Auth | `get_current_user` returns **404** when the token's user no longer exists. | Return 401. |
| Frontend | Business UI is not implemented: `api/components/context/pages/routes` are placeholders; `App.jsx`/`index.css` are Vite template. | Implement pages or document explicitly (README does). |

### Medium
| Area | Issue | Suggested fix |
|---|---|---|
| Domain | No stock/inventory; cart quantity is unbounded. | Add stock field + checks. |
| DB | `role` and `order.status` are plain `String` without CHECK/Enum. | Add `CheckConstraint` or PG Enum. |
| DB | Deleting a user cascades and deletes their order history. | Keep orders (nullable user / soft delete). |
| Typing | `phone: Mapped[str]` with `nullable=True` in `User`. | `Mapped[Optional[str]]`. |
| API | `/orders` and `/admin/orders` return all rows (no pagination). | Add page/size. |
| DB | `NullPool` opens a new connection per request. | Use a pool in production. |
| Auth | No login rate-limiting/lockout; password minimum is 6 chars. | Add throttling + stronger policy. |
| Auth | JWT stored in `localStorage` (XSS exposure); no refresh/revocation. | Consider httpOnly cookies + refresh tokens. |
| Docker | Images run as root; frontend uses `vite preview`; compose does not wire backend/frontend. | Non-root user, production server, compose services. |
| Code | Redundant `Order.id == Order.id` in `get_my_orders` (`orders.py`). | Remove. |
| Tests | `pytest-asyncio` is installed and `asyncio_mode=auto`, but all tests are sync. | Remove plugin or add async tests. |
| Docs | README says SQLAlchemy 2.0 / React Router v6; actual 2.1.5 / v7. | This file is authoritative. |
| CI | Alembic autogenerate output is unformatted; `ruff format --check` will fail on new migrations. | Run `ruff format` after generating. |

### Low
| Area | Issue |
|---|---|
| Deps | `passlib` 1.7.4 is unmaintained and forces `bcrypt==4.0.1`; consider `pwdlib` or direct `bcrypt`. |
| Deps | `python-jose` is less maintained than `PyJWT`. |
| Deps | `email-validator` is redundant with `pydantic[email]`. |
| QA | No type checker (mypy/pyright), no coverage threshold, no `pip-audit`/`npm audit` in CI. |
| Tooling | No `.nvmrc` or `engines`; local Node 24 vs CI Node 20. |
| Files | Empty `backend/app/crud/` and empty `backend/alembic/README`; leftover Vite template assets (`react.svg`, `vite.svg`, `hero.png`, `icons.svg`). |
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

---

## 12. Accepted Decisions

- `bcrypt==4.0.1` is intentionally pinned for passlib compatibility.
- Root `.env` is kept for docker-compose; the backend uses `backend/.env`.
- Requirements pin direct dependencies only (full lock still pending — see backlog).
- Frontend stays JavaScript/JSX (no TypeScript) for this project scope.

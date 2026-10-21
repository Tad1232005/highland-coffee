# Highland Coffee Architecture Specification

## Overview
Highland Coffee is a modern e-commerce web platform for coffee & tea ordering, inspired by the premium branding of Highlands Coffee.

## Current Implementation Status

| Layer | Status |
|---|---|
| Database (PostgreSQL 16, 6 tables, Alembic) | ✅ Complete |
| Backend REST API (FastAPI) | ✅ 7/7 feature areas implemented |
| Admin API (categories, products, orders) | ✅ API only — **no admin UI** |
| Frontend SPA (React 19 + Vite) | ⚠️ **Guest + Admin UI implemented, running on mock data** (`VITE_USE_MOCK=true`) |

## Architecture Layers
1. **Frontend (Client)**:
   - React 19 Single Page Application created with Vite 8.
   - Client-side routing with React Router 7 (`src/routes/index.jsx` with `RequireAuth` / `RequireAdmin`).
   - Global Contexts: `AuthProvider` (User session & token management), `CartProvider` (Cart items & badge count), `ToastProvider` + `ConfirmProvider` (user feedback, no native `alert`/`confirm`).
   - UI primitives: `src/components/Modal.jsx` (dialog + bottom sheet), `src/pages/Login.jsx` / `src/pages/Register.jsx` (auth card, shared validators in `src/utils/validation.js`), `src/components/AccountMenu.jsx` (header dropdown) and `src/hooks/useLogout.js` (single logout flow with confirm + toast).
   - Component-driven UI using Highlands brand colors (Roast `#1F1410`, Porcelain `#FAF7F2`, Highland Red `#D62828`, Lotus `#5A8A54`).
   - Data layer: `src/api` exposes one `request()` entry point serving either the real Axios client or the mock adapter (`src/mock/adapter.js`), switched by `VITE_USE_MOCK`; both return the same shapes.
   - Data loading goes through `src/hooks/useAsyncData.js` (keyed loader) to comply with the `react-hooks/set-state-in-effect` rule.
   - **Note**: business UI (guest pages + admin pages) is implemented; the frontend currently runs on mock data and has not been wired to the real API end-to-end yet.

2. **Backend (API Server)**:
   - FastAPI REST API mounted at `/api`.
   - Core modules: Security (JWT + bcrypt), Configuration (`pydantic-settings`), Rate limiting (`app/core/rate_limit.py`).
   - DB layer: SQLAlchemy 2.0 async engine and sessionmaker.
   - Data access: query logic lives directly in the route handlers — there is **no CRUD layer** (`app/crud/` is an empty package).
   - Routers:
     - `/api/auth`: Register, Login, Current User (`/me`).
     - `/api/categories`: Category management.
     - `/api/products`: Drink and food catalog with filtering, search, pagination.
     - `/api/cart`: Shopping cart items management per authenticated user.
     - `/api/orders`: Order placement, user order history, and admin order management.

3. **Database (Persistence)**:
   - PostgreSQL 16.
   - Alembic migration scripts.
   - Tables: `users`, `categories`, `products`, `cart_items`, `orders`, `order_items`.

## Security Model
- **Password hashing**: bcrypt via `app/core/security.py`; `password_hash` is never serialized in responses.
- **Password policy** (Pydantic, `app/schemas/user.py`): minimum 8 characters and must contain both a letter and a digit.
- **Email normalization**: emails are lowercased on register and login so `ADMIN@HIGHLAND.VN` and `admin@highland.vn` are the same account.
- **JWT**: HS256, `sub` = user id, `role` claim, configurable expiry.
- **Fail-fast config**: `SECRET_KEY` must be set, non-placeholder and ≥ 32 characters, otherwise the app refuses to boot (`app/core/config.py`).
- **Login throttling**: sliding-window rate limiter (`app/core/rate_limit.py`) keyed by client IP — `LOGIN_MAX_ATTEMPTS` (default 5) per `LOGIN_RATE_LIMIT_WINDOW_SECONDS` (default 300) returns **429**.
- **Timing-safe login**: unknown emails are still verified against a dummy bcrypt hash so response time does not leak account existence.
- **Authorization**: `get_current_user` returns **401** for missing/invalid tokens *and* for tokens whose user no longer exists; `require_admin` returns **403** for non-admin users.

## Request Lifecycle
1. Request hits `app/main.py` → CORS middleware → `api_router` (prefix `/api`).
2. Router handler resolves dependencies from `app/api/deps.py` (`get_db` yields one `AsyncSession` per request; `get_current_user` / `require_admin` enforce auth).
3. Handler validates input with Pydantic v2 schemas, executes SQLAlchemy 2.0 `select()` statements, and commits within a transaction where required (order creation).
4. Response is serialized by FastAPI/Pydantic; domain errors are raised as `HTTPException(status_code=..., detail=...)`.

## Key API Conventions
- All list endpoints that can grow return a pagination envelope: `{ items, total, page, size, total_pages }`.
- `GET /api/orders` → paginated list of the current user's orders.
- `GET /api/admin/orders` → paginated list of all orders, optional `?status=` filter.
- Admin endpoints live under `/api/admin/...` and require the `admin` role.
- Order status transitions are validated server-side; invalid transitions return **400**.

See [`erd.md`](erd.md) for the database schema and [`../backend/README.md`](../backend/README.md) for the full endpoint reference.

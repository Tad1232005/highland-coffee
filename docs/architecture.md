# Highland Coffee Architecture Specification

## Overview
Highland Coffee is a modern e-commerce web platform for coffee & tea ordering, inspired by the premium branding of Highlands Coffee.

## Architecture Layers
1. **Frontend (Client)**:
   - React 18+ Single Page Application created with Vite.
   - Client-side routing with React Router.
   - Global Contexts: `AuthContext` (User session & token management), `CartContext` (Cart items & badge count).
   - Component-driven UI using Highlands brand colors (Crimson Red `#b22830`, Gold `#d4a373`, Dark Espresso `#2c1810`).

2. **Backend (API Server)**:
   - FastAPI REST API mounted at `/api`.
   - Core modules: Security (JWT + bcrypt), Configuration (`pydantic-settings`).
   - DB layer: SQLAlchemy 2.0 async engine and sessionmaker.
   - Data access: CRUD functions encapsulating queries.
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

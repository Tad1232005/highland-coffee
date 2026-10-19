# GitHub Copilot Instructions for Highland Coffee Project

## Architecture & Tech Stack
- **Backend**: FastAPI, PostgreSQL 16, SQLAlchemy 2.0 (declarative mapped), Alembic, Pydantic v2, Python-JOSE JWT, Passlib Bcrypt.
- **Frontend**: React (Vite, JavaScript JSX), React Router DOM, Axios, Custom CSS styling.
- **Database**: PostgreSQL 16 managed via Docker Compose (`docker-compose.yml`).

## Essential Commands
- Docker DB: `docker compose up -d`
- Backend Migrations: `cd backend && alembic upgrade head`
- Backend Seeding: `cd backend && python -m app.seed`
- Backend Server: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend Server: `cd frontend && npm run dev`
- Tests: `cd backend && pytest`

## Code Standards
- Use SQLAlchemy 2.0 style: `Mapped[...]`, `mapped_column(...)`, `select(...)`. Avoid legacy 1.x `query()`.
- Use Pydantic v2 style: `ConfigDict(from_attributes=True)`.
- Use descriptive HTTP status codes and standard JSON error response: `{"detail": "..."}`.
- Keep frontend components clean, modular, and use contexts (`AuthContext`, `CartContext`) for global state.

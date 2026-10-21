import asyncio
import sys

import pytest
from fastapi.testclient import TestClient

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import text

from app.db.session import SyncSessionLocal
from app.main import app


@pytest.fixture(scope="session")
def client():
    """Session-scoped test client for FastAPI."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def clean_db():
    """Xoa du lieu test tao sau moi case de cac test khong anh huong nhau, giu nguyen seed data."""
    yield
    session = SyncSessionLocal()
    try:
        session.execute(text("DELETE FROM order_items"))
        session.execute(text("DELETE FROM orders"))
        session.execute(text("DELETE FROM cart_items"))
        session.execute(text("DELETE FROM products WHERE slug LIKE 'test-%'"))
        session.execute(text("DELETE FROM categories WHERE slug LIKE 'test-%'"))
        session.execute(text("DELETE FROM users WHERE email LIKE 'user_%@example.com'"))
        session.commit()
    finally:
        session.close()

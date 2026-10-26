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


@pytest.fixture(scope="session")
def order_id_baseline():
    """ID đơn hàng lớn nhất có sẵn trước khi chạy test.

    Dùng làm mốc để dọn dẹp: chỉ xoá những đơn do test tạo, giữ nguyên đơn
    mẫu (seed) đang có trong database.
    """
    with SyncSessionLocal() as session:
        return session.execute(text("SELECT COALESCE(MAX(id), 0) FROM orders")).scalar_one()


@pytest.fixture(autouse=True)
def clean_db(order_id_baseline):
    """Dọn dữ liệu do test tạo sau mỗi case để các case không ảnh hưởng lẫn nhau."""
    yield
    session = SyncSessionLocal()
    try:
        session.execute(
            text("DELETE FROM order_items WHERE order_id > :baseline"),
            {"baseline": order_id_baseline},
        )
        session.execute(
            text("DELETE FROM orders WHERE id > :baseline"),
            {"baseline": order_id_baseline},
        )
        # Chỉ dọn giỏ hàng của tài khoản dùng trong test, giữ giỏ demo.
        session.execute(
            text(
                "DELETE FROM cart_items WHERE user_id IN ("
                "SELECT id FROM users "
                "WHERE email = :seed_customer OR email LIKE 'user_%@example.com'"
                ")"
            ),
            {"seed_customer": "customer@highland.vn"},
        )
        session.execute(text("DELETE FROM products WHERE slug LIKE 'test-%'"))
        session.execute(text("DELETE FROM categories WHERE slug LIKE 'test-%'"))
        session.execute(text("DELETE FROM users WHERE email LIKE 'user_%@example.com'"))
        session.commit()
    finally:
        session.close()

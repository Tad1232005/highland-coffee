import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.db.session import SyncSessionLocal


def test_order_history_survives_user_deletion(client):
    """Deleting a user must not erase the order history (ON DELETE SET NULL)."""
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": unique_email,
            "password": "Password@123",
            "full_name": "History Keeper",
        },
    )
    assert reg_res.status_code == 201
    user_id = reg_res.json()["id"]

    login_res = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": "Password@123"},
    )
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    product = client.get("/api/products?page=1&size=1").json()["items"][0]
    added = client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=headers,
    )
    assert added.status_code == 201

    order_res = client.post(
        "/api/orders",
        json={
            "receiver_name": "History Keeper",
            "phone": "0912345678",
            "address": "1 Test Street, District 1",
        },
        headers=headers,
    )
    assert order_res.status_code == 201
    order_id = order_res.json()["id"]

    session = SyncSessionLocal()
    try:
        session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
        session.commit()
        row = session.execute(
            text("SELECT user_id, receiver_name FROM orders WHERE id = :oid"),
            {"oid": order_id},
        ).fetchone()
    finally:
        session.close()

    assert row is not None
    assert row[0] is None  # user_id nulled by ON DELETE SET NULL
    assert row[1] == "History Keeper"  # order snapshot data preserved


def test_database_rejects_invalid_values():
    """The database itself enforces the role / status / price / quantity domains."""
    session = SyncSessionLocal()
    try:
        with pytest.raises(IntegrityError):
            session.execute(
                text(
                    "INSERT INTO products "
                    "(category_id, name, slug, price, is_available, created_at, updated_at) "
                    "VALUES (1, 'Negative Price', :slug, -1, true, now(), now())"
                ),
                {"slug": f"test-neg-{uuid.uuid4().hex[:8]}"},
            )
        session.rollback()

        with pytest.raises(IntegrityError):
            session.execute(
                text("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (1, 1, 0)")
            )
        session.rollback()
    finally:
        session.close()


def test_customer_only_sees_own_orders(client):
    """A customer never sees another customer's orders in the list endpoint."""
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": unique_email,
            "password": "Password@123",
            "full_name": "Order Isolation",
        },
    )
    assert reg_res.status_code == 201

    login_res = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": "Password@123"},
    )
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    my_user_id = client.get("/api/auth/me", headers=headers).json()["id"]

    res = client.get("/api/orders", headers=headers)
    assert res.status_code == 200
    for order in res.json()["items"]:
        assert order["user_id"] == my_user_id

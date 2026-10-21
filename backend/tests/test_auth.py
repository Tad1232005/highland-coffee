import uuid

from sqlalchemy import text

from app.db.session import SyncSessionLocal


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_register_and_login_flow(client):
    """Test complete register and login flow for a new user."""
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    register_payload = {
        "email": unique_email,
        "password": "Password@123",
        "full_name": "Nguyen Van Test",
        "phone": "0988776655",
    }

    # Register
    reg_res = client.post("/api/auth/register", json=register_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == unique_email
    assert user_data["role"] == "customer"

    # Duplicate register should fail
    dup_res = client.post("/api/auth/register", json=register_payload)
    assert dup_res.status_code == 400

    # Login with correct password
    login_res = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": "Password@123"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Login with wrong password
    wrong_login = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": "WrongPassword"},
    )
    assert wrong_login.status_code == 401

    # Access /auth/me with valid token
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == unique_email

    # Access /auth/me without token
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401


def test_register_rejects_weak_password(client):
    """Password policy: at least 8 chars, one letter and one digit."""
    payload = {
        "email": f"user_{uuid.uuid4().hex[:8]}@example.com",
        "password": "abc",
        "full_name": "Weak Password",
    }
    assert client.post("/api/auth/register", json=payload).status_code == 422

    payload["password"] = "onlylettershere"
    assert client.post("/api/auth/register", json=payload).status_code == 422

    payload["password"] = "123456789012"
    assert client.post("/api/auth/register", json=payload).status_code == 422


def test_email_is_normalized_to_lowercase(client):
    """Registration and login both treat emails case-insensitively."""
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": unique_email.upper(),
            "password": "Password@123",
            "full_name": "Case Test",
        },
    )
    assert reg_res.status_code == 201
    assert reg_res.json()["email"] == unique_email

    login_res = client.post(
        "/api/auth/login",
        json={"email": unique_email.upper(), "password": "Password@123"},
    )
    assert login_res.status_code == 200


def test_token_of_deleted_user_returns_401(client):
    """A valid token whose account was deleted is an auth failure (401), not 404."""
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": unique_email,
            "password": "Password@123",
            "full_name": "Soon Deleted",
        },
    )
    assert reg_res.status_code == 201
    user_id = reg_res.json()["id"]

    login_res = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": "Password@123"},
    )
    token = login_res.json()["access_token"]

    session = SyncSessionLocal()
    try:
        session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
        session.commit()
    finally:
        session.close()

    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 401


def test_login_is_throttled_after_repeated_failures(client):
    """Repeated failed logins are throttled with 429."""
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": unique_email,
            "password": "Password@123",
            "full_name": "Throttle Test",
        },
    )
    assert reg_res.status_code == 201

    for _ in range(5):
        failed = client.post(
            "/api/auth/login",
            json={"email": unique_email, "password": "WrongPassword@1"},
        )
        assert failed.status_code == 401

    blocked = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": "WrongPassword@1"},
    )
    assert blocked.status_code == 429

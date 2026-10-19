import uuid


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
        "full_name": "Nguyễn Văn Test",
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

def get_user_token(client, email="customer@highland.vn", password="Customer@123456"):
    """Helper to authenticate a user."""
    res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


def get_admin_token(client):
    """Helper to authenticate admin."""
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@highland.vn", "password": "Admin@123456"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


def test_cart_and_order_flow(client):
    """Test cart management and order placement in single transaction."""
    user_token = get_user_token(client)
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # Clean existing cart
    client.delete("/api/cart/items", headers=user_headers)

    # Fetch available product
    prod_res = client.get("/api/products?page=1&size=2")
    products = prod_res.json()["items"]
    prod1 = products[0]
    prod2 = products[1]

    # 1. Add items to cart
    add_res = client.post(
        "/api/cart/items",
        json={"product_id": prod1["id"], "quantity": 2},
        headers=user_headers,
    )
    assert add_res.status_code == 201
    cart = add_res.json()
    assert cart["total_quantity"] == 2

    # Add second item
    client.post(
        "/api/cart/items",
        json={"product_id": prod2["id"], "quantity": 1},
        headers=user_headers,
    )

    # 2. Update quantity
    cart_items = client.get("/api/cart/items", headers=user_headers).json()["items"]
    item_to_update = cart_items[0]
    update_res = client.patch(
        f"/api/cart/items/{item_to_update['id']}",
        json={"quantity": 3},
        headers=user_headers,
    )
    assert update_res.status_code == 200

    # 3. Create Order from Cart
    order_payload = {
        "receiver_name": "Lê Thị Trà",
        "phone": "0933445566",
        "address": "456 Hai Bà Trưng, Quận 1, TP.HCM",
        "note": "Giao giờ hành chính",
    }
    order_res = client.post("/api/orders", json=order_payload, headers=user_headers)
    assert order_res.status_code == 201
    order = order_res.json()
    assert order["status"] == "pending"
    assert order["receiver_name"] == order_payload["receiver_name"]
    assert len(order["items"]) == 2
    order_id = order["id"]

    # 4. Verify snapshot price is saved correctly
    for it in order["items"]:
        assert it["unit_price"] > 0
        assert it["product_name"] is not None

    # 5. Verify cart is empty after checkout (atomic transaction)
    empty_cart = client.get("/api/cart/items", headers=user_headers).json()
    assert empty_cart["total_quantity"] == 0
    assert len(empty_cart["items"]) == 0

    # 6. Customer can view own order
    my_order = client.get(f"/api/orders/{order_id}", headers=user_headers)
    assert my_order.status_code == 200
    assert my_order.json()["id"] == order_id


def test_order_status_transitions_and_rules(client):
    """Test order state machine: pending -> confirmed -> preparing -> completed."""
    user_token = get_user_token(client)
    admin_token = get_admin_token(client)
    user_headers = {"Authorization": f"Bearer {user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Add 1 product and place order
    prod = client.get("/api/products?page=1&size=1").json()["items"][0]
    client.post(
        "/api/cart/items",
        json={"product_id": prod["id"], "quantity": 1},
        headers=user_headers,
    )
    order = client.post(
        "/api/orders",
        json={"receiver_name": "Test Rules", "phone": "0987654321", "address": "789 Điện Biên Phủ"},
        headers=user_headers,
    ).json()
    order_id = order["id"]
    assert order["status"] == "pending"

    # Step 1: pending -> confirmed (Valid)
    r = client.patch(
        f"/api/admin/orders/{order_id}/status",
        json={"status": "confirmed"},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "confirmed"

    # Step 2: confirmed -> completed (Invalid jump! Must go to preparing first)
    bad_jump = client.patch(
        f"/api/admin/orders/{order_id}/status",
        json={"status": "completed"},
        headers=admin_headers,
    )
    assert bad_jump.status_code == 400

    # Step 3: confirmed -> preparing (Valid)
    r = client.patch(
        f"/api/admin/orders/{order_id}/status",
        json={"status": "preparing"},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "preparing"

    # Step 4: preparing -> completed (Valid)
    r = client.patch(
        f"/api/admin/orders/{order_id}/status",
        json={"status": "completed"},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "completed"

    # Step 5: completed -> cancelled (Invalid! Terminal state)
    terminal_test = client.patch(
        f"/api/admin/orders/{order_id}/status",
        json={"status": "cancelled"},
        headers=admin_headers,
    )
    assert terminal_test.status_code == 400


def test_my_orders_are_paginated(client):
    """GET /orders returns a paginated envelope instead of a bare array."""
    user_headers = {"Authorization": f"Bearer {get_user_token(client)}"}

    res = client.get("/api/orders?page=1&size=5", headers=user_headers)
    assert res.status_code == 200
    data = res.json()
    assert {"items", "total", "page", "size", "total_pages"}.issubset(data.keys())
    assert data["page"] == 1
    assert data["size"] == 5
    assert len(data["items"]) <= 5


def test_admin_order_list_filters_and_paginates(client):
    """GET /admin/orders supports status filtering, pagination and rejects bad status."""
    admin_headers = {"Authorization": f"Bearer {get_admin_token(client)}"}

    res = client.get("/api/admin/orders?status=pending&page=1&size=10", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert {"items", "total", "page", "size", "total_pages"}.issubset(data.keys())
    assert data["page"] == 1
    assert data["size"] == 10
    for item in data["items"]:
        assert item["status"] == "pending"

    bad_status = client.get("/api/admin/orders?status=shipped", headers=admin_headers)
    assert bad_status.status_code == 400

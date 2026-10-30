import uuid


def get_admin_token(client):
    """Helper to authenticate as the seeded admin."""
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@highland.vn", "password": "Admin@123456"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


def test_delete_category_with_products_returns_400(client):
    """A category that still owns products must fail with 400, never 500."""
    admin_headers = {"Authorization": f"Bearer {get_admin_token(client)}"}

    category_res = client.post(
        "/api/categories",
        json={
            "name": f"Test Protected {uuid.uuid4().hex[:6]}",
            "slug": f"test-protected-{uuid.uuid4().hex[:6]}",
            "description": "Category used by the test-suite",
        },
        headers=admin_headers,
    )
    assert category_res.status_code == 201
    category_id = category_res.json()["id"]

    product_res = client.post(
        "/api/products",
        json={
            "category_id": category_id,
            "name": "Test Product Inside Protected Category",
            "slug": f"test-prod-{uuid.uuid4().hex[:6]}",
            "price": 10000,
        },
        headers=admin_headers,
    )
    assert product_res.status_code == 201

    delete_res = client.delete(f"/api/categories/{category_id}", headers=admin_headers)
    assert delete_res.status_code == 400
    assert "products" in delete_res.json()["detail"].lower()

    # The category must still exist after the rejected delete.
    assert client.get(f"/api/categories/{category_id}").status_code == 200


def test_delete_empty_category_returns_204(client):
    """A category without products can be removed."""
    admin_headers = {"Authorization": f"Bearer {get_admin_token(client)}"}

    category_res = client.post(
        "/api/categories",
        json={
            "name": f"Test Empty {uuid.uuid4().hex[:6]}",
            "slug": f"test-empty-{uuid.uuid4().hex[:6]}",
        },
        headers=admin_headers,
    )
    assert category_res.status_code == 201
    category_id = category_res.json()["id"]

    delete_res = client.delete(f"/api/categories/{category_id}", headers=admin_headers)
    assert delete_res.status_code == 204
    assert client.get(f"/api/categories/{category_id}").status_code == 404


def test_customer_cannot_manage_categories(client):
    """Regular customers are rejected from the admin category endpoints."""
    login_res = client.post(
        "/api/auth/login",
        json={"email": "customer@highland.vn", "password": "Customer@123456"},
    )
    customer_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    res = client.post(
        "/api/categories",
        json={"name": "Hacked", "slug": f"test-hack-{uuid.uuid4().hex[:6]}"},
        headers=customer_headers,
    )
    assert res.status_code == 403


def test_duplicate_category_name_is_rejected(client):
    """Slug / name collisions are rejected with 400."""
    admin_headers = {"Authorization": f"Bearer {get_admin_token(client)}"}

    payload = {
        "name": f"Test Dup {uuid.uuid4().hex[:6]}",
        "slug": f"test-dup-{uuid.uuid4().hex[:6]}",
    }
    assert client.post("/api/categories", json=payload, headers=admin_headers).status_code == 201
    assert client.post("/api/categories", json=payload, headers=admin_headers).status_code == 400


def test_create_category_with_name_and_slug_from_different_categories(client):
    """Two matching rows must produce a validation error rather than a server error."""
    headers = {"Authorization": f"Bearer {get_admin_token(client)}"}
    suffix = uuid.uuid4().hex[:8]
    first = {"name": f"Test First {suffix}", "slug": f"test-first-{suffix}"}
    second = {"name": f"Test Second {suffix}", "slug": f"test-second-{suffix}"}
    for payload in (first, second):
        assert client.post("/api/categories", json=payload, headers=headers).status_code == 201

    response = client.post(
        "/api/categories",
        json={"name": first["name"], "slug": second["slug"]},
        headers=headers,
    )
    assert response.status_code == 400


def test_update_category_rejects_duplicate_name_and_preserves_data(client):
    """A rejected rename must leave both categories intact; unchanged names remain valid."""
    headers = {"Authorization": f"Bearer {get_admin_token(client)}"}
    suffix = uuid.uuid4().hex[:8]
    categories = []
    for label in ("first", "second"):
        response = client.post(
            "/api/categories",
            json={"name": f"Test {label} {suffix}", "slug": f"test-{label}-{suffix}"},
            headers=headers,
        )
        assert response.status_code == 201
        categories.append(response.json())

    first, second = categories
    path = f"/api/categories/{second['id']}"
    response = client.put(path, json={"name": first["name"]}, headers=headers)
    assert response.status_code == 400
    assert client.get(path).json()["name"] == second["name"]
    assert client.put(path, json={"name": second["name"]}, headers=headers).status_code == 200


def test_category_mutations_refresh_cached_reads(client):
    """Tạo/sửa/xoá danh mục phải hiển thị ngay trong list và detail (cache bị xoá)."""
    headers = {"Authorization": f"Bearer {get_admin_token(client)}"}
    suffix = uuid.uuid4().hex[:8]
    name = f"Test Cache {suffix}"
    slug = f"test-cache-{suffix}"

    # Làm nóng cache list/detail trước khi ghi.
    assert client.get("/api/categories").status_code == 200

    created = client.post(
        "/api/categories",
        json={"name": name, "slug": slug},
        headers=headers,
    )
    assert created.status_code == 201
    category_id = created.json()["id"]
    assert any(c["id"] == category_id for c in client.get("/api/categories").json())

    assert client.get(f"/api/categories/{category_id}").json()["name"] == name

    renamed = f"Test Cache Renamed {suffix}"
    assert (
        client.put(
            f"/api/categories/{category_id}",
            json={"name": renamed},
            headers=headers,
        ).status_code
        == 200
    )
    assert client.get(f"/api/categories/{category_id}").json()["name"] == renamed
    listed = {c["id"]: c["name"] for c in client.get("/api/categories").json()}
    assert listed[category_id] == renamed

    assert client.delete(f"/api/categories/{category_id}", headers=headers).status_code == 204
    assert client.get(f"/api/categories/{category_id}").status_code == 404
    assert all(c["id"] != category_id for c in client.get("/api/categories").json())


def test_update_category_can_clear_description(client):
    """PUT gửi null phải xoá được description của danh mục."""
    headers = {"Authorization": f"Bearer {get_admin_token(client)}"}
    suffix = uuid.uuid4().hex[:8]
    created = client.post(
        "/api/categories",
        json={
            "name": f"Test Clear {suffix}",
            "slug": f"test-clear-{suffix}",
            "description": "Mô tả ban đầu",
        },
        headers=headers,
    )
    assert created.status_code == 201
    category_id = created.json()["id"]

    cleared = client.put(
        f"/api/categories/{category_id}",
        json={"description": None},
        headers=headers,
    )
    assert cleared.status_code == 200
    assert cleared.json()["description"] is None
    assert cleared.json()["name"] == f"Test Clear {suffix}"

import uuid


def get_admin_token(client):
    """Helper to authenticate as seeded admin."""
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@highland.vn", "password": "Admin@123456"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


def test_list_products_and_pagination(client):
    """Test products list endpoint with pagination."""
    res = client.get("/api/products?page=1&size=5")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 5
    assert data["page"] == 1


def test_search_and_filtering(client):
    """Test searching by keyword and filtering by category."""
    # Search for "Phin"
    res = client.get("/api/products?q=Phin")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    for item in data["items"]:
        assert "phin" in item["name"].lower() or "phin" in (item["description"] or "").lower()

    # Filter with min and max price
    res_price = client.get("/api/products?min_price=30000&max_price=40000")
    assert res_price.status_code == 200
    for item in res_price.json()["items"]:
        assert 30000 <= item["price"] <= 40000


def test_product_detail(client):
    """Test fetching single product detail."""
    list_res = client.get("/api/products?page=1&size=1")
    assert list_res.status_code == 200
    first_item = list_res.json()["items"][0]

    detail_res = client.get(f"/api/products/{first_item['id']}")
    assert detail_res.status_code == 200
    assert detail_res.json()["name"] == first_item["name"]


def test_admin_product_lifecycle(client):
    """Test admin create, update, and soft-delete product flow."""
    admin_token = get_admin_token(client)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Fetch existing categories to get category_id
    cat_res = client.get("/api/categories")
    assert cat_res.status_code == 200
    category_id = cat_res.json()[0]["id"]

    # Create new product
    unique_slug = f"test-drink-{uuid.uuid4().hex[:6]}"
    create_payload = {
        "category_id": category_id,
        "name": "Cà Phê Muối Highlands Special",
        "slug": unique_slug,
        "description": "Thức uống đặc biệt kết hợp lớp kem muối béo mặn",
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
        "price": 55000,
        "is_available": True,
    }

    create_res = client.post("/api/products", json=create_payload, headers=headers)
    assert create_res.status_code == 201
    created_product = create_res.json()
    product_id = created_product["id"]
    assert created_product["name"] == create_payload["name"]

    # Update product
    update_res = client.put(
        f"/api/products/{product_id}",
        json={"price": 59000, "name": "Cà Phê Muối Highlands Gold Edition"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["price"] == 59000
    assert update_res.json()["name"] == "Cà Phê Muối Highlands Gold Edition"

    # Soft delete product (set is_available = False)
    del_res = client.delete(f"/api/products/{product_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify product is marked unavailable
    verify_res = client.get(f"/api/products/{product_id}")
    assert verify_res.status_code == 200
    assert verify_res.json()["is_available"] is False


def test_customer_forbidden_from_admin_actions(client):
    """Verify regular customer cannot create products."""
    login_res = client.post(
        "/api/auth/login",
        json={"email": "customer@highland.vn", "password": "Customer@123456"},
    )
    customer_token = login_res.json()["access_token"]

    forbidden_res = client.post(
        "/api/products",
        json={"category_id": 1, "name": "Hack", "slug": "hack", "price": 1000},
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert forbidden_res.status_code == 403


def test_product_mutations_refresh_cached_reads(client):
    """Danh sách và chi tiết sản phẩm phải phản ánh thay đổi ngay, không đợi hết TTL."""
    headers = {"Authorization": f"Bearer {get_admin_token(client)}"}
    category_id = client.get("/api/categories").json()[0]["id"]

    # Làm nóng cache danh sách trước khi ghi.
    total_before = client.get("/api/products?size=100").json()["total"]

    slug = f"test-cache-{uuid.uuid4().hex[:8]}"
    created = client.post(
        "/api/products",
        json={
            "category_id": category_id,
            "name": "Test Cache Product",
            "slug": slug,
            "price": 25000,
        },
        headers=headers,
    )
    assert created.status_code == 201
    product_id = created.json()["id"]

    listed = client.get("/api/products?size=100").json()
    assert listed["total"] == total_before + 1
    assert any(item["id"] == product_id for item in listed["items"])

    # Đọc chi tiết để làm nóng cache, rồi đổi giá.
    assert client.get(f"/api/products/{product_id}").status_code == 200
    assert (
        client.put(
            f"/api/products/{product_id}",
            json={"price": 99000},
            headers=headers,
        ).status_code
        == 200
    )
    assert client.get(f"/api/products/{product_id}").json()["price"] == 99000

    # Ẩn sản phẩm -> biến mất khỏi danh sách mặc định (chỉ còn hàng đang bán).
    assert client.delete(f"/api/products/{product_id}", headers=headers).status_code == 200
    visible = client.get("/api/products?size=100").json()
    assert visible["total"] == total_before
    assert all(item["id"] != product_id for item in visible["items"])


def test_update_product_can_clear_optional_fields(client):
    """PUT gửi null phải xoá được description/image_url, không bị bỏ qua."""
    headers = {"Authorization": f"Bearer {get_admin_token(client)}"}
    category_id = client.get("/api/categories").json()[0]["id"]
    slug = f"test-clear-{uuid.uuid4().hex[:8]}"

    created = client.post(
        "/api/products",
        json={
            "category_id": category_id,
            "name": "Test Clear Fields",
            "slug": slug,
            "description": "Mô tả ban đầu",
            "image_url": "https://example.com/image.png",
            "price": 45000,
        },
        headers=headers,
    )
    assert created.status_code == 201
    product_id = created.json()["id"]

    cleared = client.put(
        f"/api/products/{product_id}",
        json={"description": None, "image_url": None},
        headers=headers,
    )
    assert cleared.status_code == 200
    assert cleared.json()["description"] is None
    assert cleared.json()["image_url"] is None
    # Field không gửi lên thì giữ nguyên.
    assert cleared.json()["name"] == "Test Clear Fields"
    assert cleared.json()["price"] == 45000

    detail = client.get(f"/api/products/{product_id}").json()
    assert detail["description"] is None
    assert detail["image_url"] is None

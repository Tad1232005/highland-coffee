"""Expand the seed database with ~10 records per table for testing/demo.

Adds 10 users, 10 categories, 10 products, ~15 cart_items, ~15 orders,
and matching order_items. Existing seed data is preserved.
"""

import sys
from datetime import datetime, timedelta

from sqlalchemy import select

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from app.core.security import get_password_hash
from app.db.session import SyncSessionLocal
from app.models.cart import CartItem
from app.models.category import Category
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User


def seed_extra():
    """Add ~10 records to each table."""
    print("=== Expanding database with test data ===\n")
    session = SyncSessionLocal()

    try:
        # ── 1. USERS (+10) ──────────────────────────────────────────────
        new_users_data = [
            # 8 additional customers
            ("customer1@highland.vn", "Trần Thị Lan", "0923456789", "customer", "Customer@123456"),
            ("customer2@highland.vn", "Lê Văn Minh", "0934567890", "customer", "Customer@123456"),
            ("customer3@highland.vn", "Phạm Thị Hoa", "0945678901", "customer", "Customer@123456"),
            (
                "customer4@highland.vn",
                "Nguyễn Văn Dũng",
                "0956789012",
                "customer",
                "Customer@123456",
            ),
            ("customer5@highland.vn", "Vũ Thị Mai", "0967890123", "customer", "Customer@123456"),
            ("customer6@highland.vn", "Đỗ Văn Tài", "0978901234", "customer", "Customer@123456"),
            ("customer7@highland.vn", "Bùi Thị Như", "0989012345", "customer", "Customer@123456"),
            (
                "customer8@highland.vn",
                "Hoàng Văn Phong",
                "0990123456",
                "customer",
                "Customer@123456",
            ),
            # 2 additional admins
            ("admin2@highland.vn", "Trần Văn Quản", "0901234568", "admin", "Admin@123456"),
            ("admin3@highland.vn", "Nguyễn Thị Quản", "0901234569", "admin", "Admin@123456"),
        ]

        print("[1/6] Adding users...")
        user_map = {}  # email → User object
        for email, name, phone, role, pwd in new_users_data:
            existing = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
            if not existing:
                u = User(
                    email=email,
                    password_hash=get_password_hash(pwd),
                    full_name=name,
                    phone=phone,
                    role=role,
                    is_active=True,
                )
                session.add(u)
                print(f"  ✓ Created user: {email} ({role})")
        session.commit()

        # Build a lookup of all users (existing + new)
        all_users = session.execute(select(User).where(User.is_active.is_(True))).scalars().all()
        for u in all_users:
            user_map[u.email] = u
        print(f"  → Total active users now: {len(all_users)}")

        # ── 2. CATEGORIES (+10) ─────────────────────────────────────────
        new_categories_data = [
            (
                "Nước Ép & Sinh Tố",
                "nuoc-ep-sinh-to",
                "Các loại nước ép tươi nguyên và sinh tố giàu chất xơ.",
            ),
            ("Nước Dừa & Nước Ép", "nuoc-dua", "Nước dừa tươi và nước ép trái cây tự nhiên."),
            (
                "Sinh Tố Trái Cây",
                "sinh-to",
                "Sinh tố trái cây đã chín, giàu protein và năng lượng.",
            ),
            (
                "Matcha & Cacao",
                "matcha-cacao",
                "Các món đậm vị Matcha Nhật Bản và cacao cao sức khỏe.",
            ),
            (
                "Smoothie Bowl",
                "smoothie-bowl",
                "Smoothie đặc sệt, trang trí hoa quả tươi, topping giòn.",
            ),
            ("Soda & Sparkling", "soda", "Nướng soda bọt nhỏ, giải nhiệt tươi mát mỗi ngày."),
            ("Chè & Trà Đá", "che-tra-da", "Các loại chè truyền thống và trà đá thanh mát."),
            ("Bánh Kẹo", "banh-keo", "Bánh ngọt, kẹo dẻo, bánh quy giòn tan đầy đủ hương vị."),
            ("Bánh Mì & Bánh Quy", "banh-mi", "Bánh mì thơm nóng, bánh quy giòn cùng cà phê."),
            ("Bữa Sáng", "breakfast", "Các bữa sáng đầy đủ chất bổ, kết hợp cà phê và bánh mì."),
        ]

        print("[2/6] Adding categories...")
        cat_map = {}  # slug → Category
        # Load existing categories
        for cat in session.execute(select(Category)).scalars().all():
            cat_map[cat.slug] = cat

        for name, slug, desc in new_categories_data:
            if slug not in cat_map:
                c = Category(name=name, slug=slug, description=desc)
                session.add(c)
                print(f"  ✓ Created category: {name}")
        session.commit()

        all_cats = session.execute(select(Category)).scalars().all()
        for cat in all_cats:
            cat_map[cat.slug] = cat
        print(f"  → Total categories now: {len(all_cats)}")

        # ── 3. PRODUCTS (+10) ───────────────────────────────────────────
        existing_products = session.execute(select(Product)).scalars().all()
        product_map = {}  # slug → Product
        for p in existing_products:
            product_map[p.slug] = p

        new_products_data = [
            # Matcha & Cacao
            {
                "category_slug": "matcha-cacao",
                "name": "Matcha Latte",
                "slug": "matcha-latte",
                "price": 55000,
                "description": "Sữa đặc hòa cùng bột Matcha Nhật Bản thơm lừng.",
                "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80",
            },
            # Smoothie Bowl
            {
                "category_slug": "smoothie-bowl",
                "name": "Smoothie Bowl Trái Cây",
                "slug": "smoothie-bowl-trai-cay",
                "price": 79000,
                "description": "Smoothie trái cây đã chín, topping hạt hạnh nhân và chia.",
                "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80",
            },
            # Soda & Sparkling
            {
                "category_slug": "soda",
                "name": "Soda Kiwi Dâu",
                "slug": "soda-kiwi-dau",
                "price": 45000,
                "description": "Nướng soda bọt nhỏ với hương kiwi và dâu ngọt đầy chất thơm.",
                "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80",
            },
            # Chè & Trà Đá
            {
                "category_slug": "che-tra-da",
                "name": "Chè Đậu Đen Nâu",
                "slug": "che-dau-den-nau",
                "price": 39000,
                "description": "Chè đậu đen hầm với đường nâu, thanh mát và đầy năng lượng.",
                "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80",
            },
            # Nước Ép & Sinh Tố
            {
                "category_slug": "nuoc-ep-sinh-to",
                "name": "Sinh Tố Bơ",
                "slug": "sinh-to-bo",
                "price": 55000,
                "description": "Sinh tố bơ tươi béo ngậy, giàu chất béo tốt cho da.",
                "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80",
            },
            # Nước Dừa & Nước Ép
            {
                "category_slug": "nuoc-dua",
                "name": "Nước Dừa Tươi",
                "slug": "nuoc-dua-tuoi",
                "price": 39000,
                "description": "Nước dừa tươi ép nguyên chất, giàu electrolit và khoáng chất.",
                "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80",
            },
            # Sinh Tố Trái Cây
            {
                "category_slug": "sinh-to",
                "name": "Sinh Tố Xoài x2",
                "slug": "sinh-to-xoai",
                "price": 52000,
                "description": "Sinh tố xoài chín ngọt, béo ngậy và đầy năng lượng.",
                "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80",
            },
            # Bánh Kẹo
            {
                "category_slug": "banh-keo",
                "name": "Bánh Brownie Sô-cô-la",
                "slug": "banh-brownie-socola",
                "price": 32000,
                "description": "Bánh brownie sô-cô-la béo ngậy, tan chảy trong miệng.",
                "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80",
            },
            # Bánh Mì & Bánh Quy
            {
                "category_slug": "banh-mi",
                "name": "Bánh Mì Thơm Thanh",
                "slug": "banh-mi-thoang",
                "price": 22000,
                "description": "Bánh mì thơm vàng, béo nhẹ, kết hợp cà phê cực hợp.",
                "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80",
            },
            # Bữa Sáng
            {
                "category_slug": "breakfast",
                "name": "Combo Breakfast Classic",
                "slug": "combo-breakfast-classic",
                "price": 89000,
                "description": "Combo đầy đủ: bánh mì, trứng ố trứng muối, xúc xích và cà phê.",
                "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80",
            },
        ]

        print("[3/6] Adding products...")
        for p_info in new_products_data:
            if p_info["slug"] in product_map:
                continue
            cat = cat_map.get(p_info["category_slug"])
            if cat:
                p = Product(
                    category_id=cat.id,
                    name=p_info["name"],
                    slug=p_info["slug"],
                    price=p_info["price"],
                    image_url=p_info["image_url"],
                    description=p_info["description"],
                    is_available=True,
                )
                session.add(p)
                print(f"  ✓ Created product: {p_info['name']} ({p_info['price']:,} VND)")
        session.commit()

        all_products = session.execute(select(Product)).scalars().all()
        for p in all_products:
            product_map[p.slug] = p
        print(f"  → Total products now: {len(all_products)}")

        # ── 4. CART ITEMS (~15) ────────────────────────────────────────
        print("[4/6] Adding cart items...")

        # Clear existing test cart items (keep seed)
        session.query(CartItem).delete(synchronize_session="fetch")
        session.commit()

        cart_items_data = [
            (user_map.get("customer1@highland.vn"), product_map.get("phin-sua-da"), 2),
            (user_map.get("customer2@highland.vn"), product_map.get("tra-sen-vang-cu-nang"), 1),
            (user_map.get("customer3@highland.vn"), product_map.get("bac-xiu-da"), 3),
            (user_map.get("customer1@highland.vn"), product_map.get("caramel-macchiato"), 1),
            (user_map.get("customer4@highland.vn"), product_map.get("freeze-tra-xanh"), 2),
            (user_map.get("customer5@highland.vn"), product_map.get("banh-mousse-cacao"), 2),
            (user_map.get("customer6@highland.vn"), product_map.get("cookies-and-cream-freeze"), 1),
            (user_map.get("customer2@highland.vn"), product_map.get("classic-phin-freeze"), 1),
            (user_map.get("customer7@highland.vn"), product_map.get("phin-sua-da"), 1),
            (user_map.get("customer8@highland.vn"), product_map.get("banh-tiramisu"), 1),
            (user_map.get("customer3@highland.vn"), product_map.get("tra-thach-dao"), 2),
            (user_map.get("customer1@highland.vn"), product_map.get("banh-mi-que-pate-cay"), 1),
            (user_map.get("customer4@highland.vn"), product_map.get("banh-pho-mai-ca-phe"), 1),
            (user_map.get("customer5@highland.vn"), product_map.get("phin-den-da"), 2),
            (user_map.get("customer6@highland.vn"), product_map.get("caramel-phin-freeze"), 1),
        ]

        cart_count = 0
        for user, product, qty in cart_items_data:
            if user and product and product.is_available:
                ci = CartItem(user_id=user.id, product_id=product.id, quantity=qty)
                session.add(ci)
                cart_count += 1
        session.commit()
        print(f"  → Created {cart_count} cart items")

        # ── 5. ORDERS (+15) ────────────────────────────────────────────
        print("[5/6] Adding orders...")

        # Clear existing test orders
        session.query(Order).delete(synchronize_session="fetch")
        session.commit()

        statuses_cycle = ["pending", "confirmed", "preparing", "completed", "cancelled"]
        customers_emails = [
            "customer@highland.vn",
            "customer1@highland.vn",
            "customer2@highland.vn",
            "customer3@highland.vn",
            "customer4@highland.vn",
            "customer5@highland.vn",
            "customer6@highland.vn",
            "customer7@highland.vn",
            "customer8@highland.vn",
            "admin2@highland.vn",
            "admin3@highland.vn",
            "customer@highland.vn",
            "customer1@highland.vn",
            "customer2@highland.vn",
            "customer3@highland.vn",
        ]

        order_items_to_create = []
        order_count = 0
        base_time = datetime.now()

        for i, email in enumerate(customers_emails):
            user = user_map.get(email)
            if not user:
                continue

            # Pick 1-3 products for each order
            products_for_order = []
            if i % 5 == 0:
                products_for_order = [
                    (product_map.get("phin-sua-da"), 2),
                    (product_map.get("banh-mousse-cacao"), 1),
                ]
            elif i % 5 == 1:
                products_for_order = [
                    (product_map.get("caramel-macchiato"), 1),
                    (product_map.get("banh-tiramisu"), 1),
                ]
            elif i % 5 == 2:
                products_for_order = [
                    (product_map.get("tra-sen-vang-cu-nang"), 2),
                    (product_map.get("freeze-tra-xanh"), 1),
                ]
            elif i % 5 == 3:
                products_for_order = [
                    (product_map.get("bac-xiu-da"), 2),
                    (product_map.get("banh-pho-mai-ca-phe"), 2),
                ]
            elif i % 5 == 4:
                products_for_order = [
                    (product_map.get("classic-phin-freeze"), 1),
                ]

            valid_items = [(p, q) for p, q in products_for_order if p]
            if not valid_items:
                continue

            total = sum(p.price * q for p, q in valid_items)
            status = statuses_cycle[i % len(statuses_cycle)]

            # Spread orders across the last 7 days so the revenue dashboard
            # (GET /api/admin/analytics/revenue?days=7) has real data.
            created_at = base_time - timedelta(days=i % 7, hours=(i * 3) % 12)

            order = Order(
                user_id=user.id,
                status=status,
                total_amount=total,
                receiver_name=user.full_name,
                phone=user.phone or "0901234567",
                address=f"Số {100 + i}, Đường Lê Lợi, Quận 1, TP. HCM",
                note="Ghi chú đơn hàng số " + str(i),
                created_at=created_at,
                completed_at=created_at if status == "completed" else None,
            )
            session.add(order)
            session.commit()  # flush to get order.id

            for prod, qty in valid_items:
                oi = OrderItem(
                    order_id=order.id,
                    product_id=prod.id,
                    product_name=prod.name,
                    unit_price=prod.price,
                    quantity=qty,
                )
                session.add(oi)
                order_items_to_create.append(oi)

            order_count += 1
            print(f"  ✓ Created order #{order.id} for {email} ({status}, {total:,} VND)")

        session.commit()

        # ── 6. ORDER ITEMS (already created above) ────────────────────
        print(f"[6/6] Order items created: {len(order_items_to_create)}")

        # ── Summary ───────────────────────────────────────────────────
        print("\n=== Summary ===")
        for Model, label in [
            (User, "users"),
            (Category, "categories"),
            (Product, "products"),
            (CartItem, "cart_items"),
            (Order, "orders"),
            (OrderItem, "order_items"),
        ]:
            cnt = session.execute(select(Model)).scalars().all()
            print(f"  {label}: {len(cnt)} records")

        print("\n✅ Database expansion complete!")

    except Exception as e:
        session.rollback()
        print(f"\n❌ Error: {e}", file=sys.stderr)
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_extra()

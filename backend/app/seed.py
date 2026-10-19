import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from sqlalchemy import select
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SyncSessionLocal
from app.models.category import Category
from app.models.product import Product
from app.models.user import User


def seed_database():
    """Seed initial categories, products, and admin user."""
    print("Starting database seed...")
    session = SyncSessionLocal()

    try:
        # 1. Seed Admin User
        admin_user = session.execute(
            select(User).where(User.email == settings.INITIAL_ADMIN_EMAIL)
        ).scalar_one_or_none()

        if not admin_user:
            admin_user = User(
                email=settings.INITIAL_ADMIN_EMAIL,
                password_hash=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                full_name=settings.INITIAL_ADMIN_NAME,
                phone=settings.INITIAL_ADMIN_PHONE,
                role="admin",
                is_active=True,
            )
            session.add(admin_user)
            print(f"Created admin user: {settings.INITIAL_ADMIN_EMAIL}")

        # Seed Test Customer User
        test_customer_email = "customer@highland.vn"
        customer_user = session.execute(
            select(User).where(User.email == test_customer_email)
        ).scalar_one_or_none()

        if not customer_user:
            customer_user = User(
                email=test_customer_email,
                password_hash=get_password_hash("Customer@123456"),
                full_name="Nguyễn Văn Khách",
                phone="0912345678",
                role="customer",
                is_active=True,
            )
            session.add(customer_user)
            print(f"Created customer user: {test_customer_email}")

        session.commit()

        # 2. Seed Categories
        categories_data = [
            {
                "name": "Cà Phê Phin & Espresso",
                "slug": "ca-phe",
                "description": "Hương vị cà phê truyền thống Việt Nam đậm đà kết hợp cùng phong cách pha chế hiện đại.",
            },
            {
                "name": "Trà Tuyệt Hảo",
                "slug": "tra",
                "description": "Các món trà sen vàng, trà thạch đào thanh mát đặc trưng với hạt sen bùi béo và thạch giòn thơm.",
            },
            {
                "name": "Freeze Đá Xay",
                "slug": "freeze",
                "description": "Thức uống đá xay mát lạnh, béo ngậy kem tươi hòa quyện thạch giòn sần sật.",
            },
            {
                "name": "Bánh Ngọt & Bánh Mì",
                "slug": "banh-ngot",
                "description": "Các loại bánh ngọt Âu, bánh phô mai và bánh mì que giòn rụm kết hợp hoàn hảo cùng đồ uống.",
            },
        ]

        category_map = {}
        for cat_info in categories_data:
            cat = session.execute(
                select(Category).where(Category.slug == cat_info["slug"])
            ).scalar_one_or_none()

            if not cat:
                cat = Category(
                    name=cat_info["name"],
                    slug=cat_info["slug"],
                    description=cat_info["description"],
                )
                session.add(cat)
                session.flush()
                print(f"Created category: {cat.name}")
            category_map[cat.slug] = cat

        session.commit()

        # 3. Seed Products (~18 signature Highlands drinks & bakery items)
        products_data = [
            # Cà phê
            {
                "category_slug": "ca-phe",
                "name": "Phin Sữa Đá",
                "slug": "phin-sua-da",
                "price": 39000,
                "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
                "description": "Hương vị cà phê Robusta Việt Nam được chiết xuất qua phin truyền thống hòa quyện cùng sữa đặc béo ngậy ngọt ngào.",
            },
            {
                "category_slug": "ca-phe",
                "name": "Phin Đen Đá",
                "slug": "phin-den-da",
                "price": 35000,
                "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80",
                "description": "Dành cho tín đồ cà phê đích thực say mê vị đắng đậm đà, mùi hương rang xay quyến rũ đánh thức mọi giác quan.",
            },
            {
                "category_slug": "ca-phe",
                "name": "Bạc Xỉu Đá",
                "slug": "bac-xiu-da",
                "price": 39000,
                "image_url": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80",
                "description": "Sự kết hợp hoàn hảo giữa sữa tươi thanh dịu, sữa đặc ngọt bùi và một chút điểm xuyết cà phê phin thơm lừng.",
            },
            {
                "category_slug": "ca-phe",
                "name": "Phin Sữa Tươi Bánh Flan",
                "slug": "phin-sua-tuoi-banh-flan",
                "price": 49000,
                "image_url": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
                "description": "Tuyệt phẩm mới với bánh flan béo mịn tan chảy trong vị sữa tươi thanh mát và cà phê phin đậm đà.",
            },
            {
                "category_slug": "ca-phe",
                "name": "Caramel Macchiato",
                "slug": "caramel-macchiato",
                "price": 59000,
                "image_url": "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&auto=format&fit=crop&q=80",
                "description": "Cà phê Espresso chuẩn Ý hòa quyện cùng sữa tươi bọt mịn và sốt caramel thơm lừng ngọt ngào.",
            },

            # Trà
            {
                "category_slug": "tra",
                "name": "Trà Sen Vàng (Củ Năng)",
                "slug": "tra-sen-vang-cu-nang",
                "price": 49000,
                "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
                "description": "Biểu tượng Highlands với cốt trà Ô Long thanh tao, hạt sen hầm bùi bùi, thạch củ năng giòn ngọt và lớp kem sữa béo ngậy.",
            },
            {
                "category_slug": "tra",
                "name": "Trà Thạch Đào",
                "slug": "tra-thach-dao",
                "price": 49000,
                "image_url": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80",
                "description": "Vị trà đen đậm đà pha chút chua ngọt của đào, đi kèm từng miếng thạch đào giòn rụm sảng khoái.",
            },
            {
                "category_slug": "tra",
                "name": "Trà Thanh Đào",
                "slug": "tra-thanh-dao",
                "price": 49000,
                "image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80",
                "description": "Sự kết hợp giữa vị thanh ngọt của trà và quả đào giòn tươi mọng nước xua tan cái nóng oi ả.",
            },
            {
                "category_slug": "tra",
                "name": "Trà Thạch Vải",
                "slug": "tra-thach-vai",
                "price": 49000,
                "image_url": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80",
                "description": "Hương thơm nồng nàn của quả vải chín mọng kết hợp trà xanh tinh tế và thạch dai ngọt mát.",
            },
            {
                "category_slug": "tra",
                "name": "Trà Xanh Đậu Đỏ",
                "slug": "tra-xanh-dau-do",
                "price": 49000,
                "image_url": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80",
                "description": "Trà xanh thượng hạng thơm thoang thoảng kết hợp cùng đậu đỏ Nhật Bản bùi béo ngọt dịu.",
            },

            # Freeze
            {
                "category_slug": "freeze",
                "name": "Freeze Trà Xanh",
                "slug": "freeze-tra-xanh",
                "price": 59000,
                "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&auto=format&fit=crop&q=80",
                "description": "Bột trà xanh Matcha cao cấp xay cùng đá nhuyễn, thạch trà xanh giòn dai và bông kem tươi béo ngậy bên trên.",
            },
            {
                "category_slug": "freeze",
                "name": "Caramel Phin Freeze",
                "slug": "caramel-phin-freeze",
                "price": 59000,
                "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
                "description": "Cà phê phin truyền thống xay cùng thạch cà phê giòn, caramel thơm ngọt và lớp kem tươi hấp dẫn.",
            },
            {
                "category_slug": "freeze",
                "name": "Classic Phin Freeze",
                "slug": "classic-phin-freeze",
                "price": 59000,
                "image_url": "https://images.unsplash.com/photo-1558857563-b37fe4f0d36c?w=600&auto=format&fit=crop&q=80",
                "description": "Dành riêng cho fan cà phê yêu thích cảm giác sảng khoái với đá xay mát rượi và vị cà phê đậm đà.",
            },
            {
                "category_slug": "freeze",
                "name": "Cookies & Cream Freeze",
                "slug": "cookies-and-cream-freeze",
                "price": 59000,
                "image_url": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80",
                "description": "Bánh oreo sô-cô-la xay nhuyễn cùng sữa tươi và kem, ngọt ngào giòn tan trong từng ngụm.",
            },

            # Bánh & Snack
            {
                "category_slug": "banh-ngot",
                "name": "Bánh Mousse Cacao",
                "slug": "banh-mousse-cacao",
                "price": 35000,
                "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
                "description": "Lớp mousse cacao mềm mịn, đậm đà vị sô-cô-la nguyên chất, không quá ngọt, ăn kèm cà phê cực đỉnh.",
            },
            {
                "category_slug": "banh-ngot",
                "name": "Bánh Phô Mai Cà Phê",
                "slug": "banh-pho-mai-ca-phe",
                "price": 35000,
                "image_url": "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop&q=80",
                "description": "Hương vị phô mai béo ngậy hòa quyện cùng cà phê thơm ngát với lớp đế bánh quy giòn tan.",
            },
            {
                "category_slug": "banh-ngot",
                "name": "Bánh Tiramisu",
                "slug": "banh-tiramisu",
                "price": 39000,
                "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
                "description": "Bánh Tiramisu truyền thống nước Ý với phô mai Mascarpone béo dịu và hương cà phê thơm nức.",
            },
            {
                "category_slug": "banh-ngot",
                "name": "Bánh Mì Que Pate Cay",
                "slug": "banh-mi-que-pate-cay",
                "price": 25000,
                "image_url": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80",
                "description": "Vỏ bánh mì que nướng giòn rụm bên ngoài, nhân pate béo ngậy cùng tương ớt cay nồng đậm vị truyền thống.",
            },
        ]

        for p_info in products_data:
            existing_product = session.execute(
                select(Product).where(Product.slug == p_info["slug"])
            ).scalar_one_or_none()

            category = category_map[p_info["category_slug"]]
            if not existing_product:
                new_product = Product(
                    category_id=category.id,
                    name=p_info["name"],
                    slug=p_info["slug"],
                    price=p_info["price"],
                    image_url=p_info["image_url"],
                    description=p_info["description"],
                    is_available=True,
                )
                session.add(new_product)
                print(f"Created product: {p_info['name']} ({p_info['price']:,} VND)")

        session.commit()
        print("Database seeded successfully with admin, categories, and 18 products!")

    except Exception as e:
        session.rollback()
        print(f"Error seeding database: {e}", file=sys.stderr)
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()

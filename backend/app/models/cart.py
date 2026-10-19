from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="cart_items")
    product: Mapped["Product"] = relationship("Product", back_populates="cart_items")

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_cart_items_user_product"),
    )

    def __repr__(self) -> str:
        return f"<CartItem user={self.user_id} product={self.product_id} qty={self.quantity}>"

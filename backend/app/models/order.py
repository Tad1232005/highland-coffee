from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User

ORDER_STATUSES = ("pending", "confirmed", "preparing", "completed", "cancelled")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # Nullable + ON DELETE SET NULL so that deleting a user never destroys
    # order history (the order keeps its own receiver_name / phone snapshot).
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
        index=True,
    )  # pending, confirmed, preparing, completed, cancelled
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)  # VND
    receiver_name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')",
            name="ck_orders_status",
        ),
        Index("ix_orders_user_id", "user_id"),
        Index("ix_orders_status", "status"),
        Index("ix_orders_status_completed_at", "status", "completed_at"),
        # Composite indexes for the ORDER BY created_at DESC queries used by
        # both get_my_orders (customer) and admin_list_orders (admin).
        Index("ix_orders_created_at", "created_at"),
        Index("ix_orders_user_created_at", "user_id", text("created_at DESC"), text("id DESC")),
        Index("ix_orders_status_created_at", "status", text("created_at DESC"), text("id DESC")),
    )

    def __repr__(self) -> str:
        return (
            f"<Order #{self.id} user={self.user_id} total={self.total_amount} status={self.status}>"
        )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False)  # snapshot VND price
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")

    __table_args__ = (CheckConstraint("quantity >= 1", name="ck_order_items_quantity"),)

    def __repr__(self) -> str:
        return f"<OrderItem order={self.order_id} product='{self.product_name}' price={self.unit_price} qty={self.quantity}>"

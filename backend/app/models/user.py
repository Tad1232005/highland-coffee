from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, CheckConstraint, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cart import CartItem
    from app.models.order import Order


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    role: Mapped[str] = mapped_column(
        String(20), default="customer", nullable=False
    )  # 'customer' | 'admin'
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    cart_items: Mapped[List["CartItem"]] = relationship(
        "CartItem",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    # Orders are intentionally NOT cascaded: deleting a user must not erase
    # order history. The FK is ON DELETE SET NULL, the DB handles the nulling.
    orders: Mapped[List["Order"]] = relationship(
        "Order",
        back_populates="user",
        passive_deletes=True,
    )

    __table_args__ = (CheckConstraint("role IN ('customer', 'admin')", name="ck_users_role"),)

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"

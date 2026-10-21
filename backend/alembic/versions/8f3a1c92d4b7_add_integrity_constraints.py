"""add integrity constraints and preserve order history on user deletion

Revision ID: 8f3a1c92d4b7
Revises: 49e9c7af2200
Create Date: 2026-10-21 10:12:44.101288

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8f3a1c92d4b7"
down_revision: Union[str, Sequence[str], None] = "49e9c7af2200"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Domain constraints - the database itself now rejects invalid values.
    op.create_check_constraint(
        "ck_users_role",
        "users",
        "role IN ('customer', 'admin')",
    )
    op.create_check_constraint(
        "ck_orders_status",
        "orders",
        "status IN ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')",
    )
    op.create_check_constraint(
        "ck_products_price",
        "products",
        "price >= 0",
    )
    op.create_check_constraint(
        "ck_cart_items_quantity",
        "cart_items",
        "quantity >= 1",
    )

    # 2. Keep order history when a user is deleted (user_id becomes nullable
    #    and the FK switches from CASCADE to SET NULL).
    op.alter_column(
        "orders",
        "user_id",
        existing_type=sa.Integer(),
        nullable=True,
    )
    op.drop_constraint("orders_user_id_fkey", "orders", type_="foreignkey")
    op.create_foreign_key(
        "fk_orders_user_id_users",
        "orders",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # 3. Partial index serving the default catalogue listing
    #    (WHERE is_available = true ORDER BY id DESC).
    op.create_index(
        "ix_products_available_id",
        "products",
        ["id"],
        unique=False,
        postgresql_where=sa.text("is_available = true"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_products_available_id", table_name="products")

    # Restore the strict FK: orphaned orders must be removed first.
    op.drop_constraint("fk_orders_user_id_users", "orders", type_="foreignkey")
    op.execute("DELETE FROM orders WHERE user_id IS NULL")
    op.alter_column(
        "orders",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
    op.create_foreign_key(
        "orders_user_id_fkey",
        "orders",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_constraint("ck_cart_items_quantity", "cart_items", type_="check")
    op.drop_constraint("ck_products_price", "products", type_="check")
    op.drop_constraint("ck_orders_status", "orders", type_="check")
    op.drop_constraint("ck_users_role", "users", type_="check")

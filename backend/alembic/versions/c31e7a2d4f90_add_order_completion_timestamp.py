"""add order completion timestamp

Revision ID: c31e7a2d4f90
Revises: 8f3a1c92d4b7
Create Date: 2026-10-24 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c31e7a2d4f90"
down_revision: Union[str, Sequence[str], None] = "8f3a1c92d4b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add a timestamp for when an order is completed."""
    op.add_column(
        "orders",
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Historical completion time was not recorded; use order creation as the
    # best available date for existing completed orders.
    op.execute(
        sa.text(
            "UPDATE orders SET completed_at = created_at "
            "WHERE status = 'completed' AND completed_at IS NULL"
        )
    )
    op.create_index(
        "ix_orders_status_completed_at",
        "orders",
        ["status", "completed_at"],
    )


def downgrade() -> None:
    """Remove the completion timestamp."""
    op.drop_index("ix_orders_status_completed_at", table_name="orders")
    op.drop_column("orders", "completed_at")

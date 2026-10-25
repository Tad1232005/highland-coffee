"""merge order indexes and completion timestamp heads

Revision ID: 09dc05241b4f
Revises: c31e7a2d4f90, 24fa34f88cbb
Create Date: 2026-10-25 11:47:19.597573

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "09dc05241b4f"
down_revision: Union[str, Sequence[str], None] = ("c31e7a2d4f90", "24fa34f88cbb")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

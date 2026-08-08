"""add is_admin to users

Revision ID: 6b7c8d9e0f1a
Revises: 5a6b7c8d9e0f
Create Date: 2026-08-08 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "6b7c8d9e0f1a"
down_revision: str | None = "5a6b7c8d9e0f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute("UPDATE users SET is_admin = TRUE WHERE role = 'admin'")


def downgrade() -> None:
    op.drop_column("users", "is_admin")

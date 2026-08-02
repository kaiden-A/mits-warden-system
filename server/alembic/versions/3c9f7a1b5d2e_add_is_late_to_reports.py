"""add is_late to reports

Revision ID: 3c9f7a1b5d2e
Revises: 2a1b3c4d5e6f
Create Date: 2026-08-03 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "3c9f7a1b5d2e"
down_revision: str | None = "2a1b3c4d5e6f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "reports",
        sa.Column("is_late", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute(
        """
        UPDATE reports
        SET is_late = submitted_at > (
            (date + INTERVAL '1 day')::timestamp AT TIME ZONE 'Asia/Kuala_Lumpur'
        )
        WHERE submitted_at IS NOT NULL
        """
    )


def downgrade() -> None:
    op.drop_column("reports", "is_late")

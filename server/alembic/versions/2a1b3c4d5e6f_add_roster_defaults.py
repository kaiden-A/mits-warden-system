"""add roster_defaults table

Revision ID: 2a1b3c4d5e6f
Revises: 4b03b0885be6
Create Date: 2026-07-30 11:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "2a1b3c4d5e6f"
down_revision: str | None = "4b03b0885be6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "roster_defaults",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("putera_warden_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("puteri_warden_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("updated_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("roster_defaults")

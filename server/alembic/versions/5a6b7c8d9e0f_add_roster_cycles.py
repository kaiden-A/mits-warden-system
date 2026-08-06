"""add roster_cycles and roster_cycle_entries tables

Revision ID: 5a6b7c8d9e0f
Revises: 3c9f7a1b5d2e
Create Date: 2026-08-06 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "5a6b7c8d9e0f"
down_revision: str | None = "3c9f7a1b5d2e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "roster_cycles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("pairs", sa.JSON(), nullable=False),
        sa.Column("excluded_dates", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_cycle_dates", "roster_cycles", ["start_date", "end_date"])

    op.create_table(
        "roster_cycle_entries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "cycle_id",
            UUID(as_uuid=True),
            sa.ForeignKey("roster_cycles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("pair_name", sa.String(), nullable=True),
        sa.Column("putera_warden_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("puteri_warden_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.UniqueConstraint("cycle_id", "date", name="uq_cycle_entry_date"),
    )


def downgrade() -> None:
    op.drop_table("roster_cycle_entries")
    op.drop_table("roster_cycles")
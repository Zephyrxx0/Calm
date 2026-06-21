"""drop daily_summaries — single source of truth is activity_logs

Revision ID: e8f5b2c47a91
Revises: d4e2b7f91c33
Create Date: 2026-06-21

The heatmap now derives directly from activity_logs (count-based intensity).
The daily_summaries table is no longer read or written, so we drop it.

Down migration recreates an empty daily_summaries table with the original
schema — historical aggregates are not restorable without re-running the
preceding migration's data step.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8f5b2c47a91"
down_revision: Union[str, Sequence[str], None] = "d4e2b7f91c33"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("ix_daily_summaries_date", table_name="daily_summaries")
    op.drop_index("ix_daily_summaries_firebase_uid", table_name="daily_summaries")
    op.drop_constraint("one_summary_per_day", "daily_summaries", type_="unique")
    op.drop_table("daily_summaries")


def downgrade() -> None:
    op.create_table(
        "daily_summaries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("firebase_uid", sa.String(length=128), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("aggregate_consciousness", sa.Integer(), nullable=False),
        sa.Column("log_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["firebase_uid"],
            ["users.firebase_uid"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "firebase_uid", "date", name="one_summary_per_day"
        ),
    )
    op.create_index(
        "ix_daily_summaries_firebase_uid", "daily_summaries", ["firebase_uid"]
    )
    op.create_index("ix_daily_summaries_date", "daily_summaries", ["date"])

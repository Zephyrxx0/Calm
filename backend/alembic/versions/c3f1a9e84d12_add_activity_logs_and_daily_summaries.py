"""add activity_logs and daily_summaries tables

Revision ID: c3f1a9e84d12
Revises: 7e72306dc22b
Create Date: 2026-06-21

Adds:
  - activity_logs  — individual tracking events (multi per day)
  - daily_summaries — aggregated heatmap score (one per user per day)

The old daily_entries table is kept for backwards-compatibility with
existing data; it can be dropped in a future migration once data is migrated.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = "c3f1a9e84d12"
down_revision: Union[str, Sequence[str], None] = "7e72306dc22b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- activity_logs -------------------------------------------------
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("firebase_uid", sa.String(length=128), nullable=False),
        sa.Column("activity_type", sa.String(length=30), nullable=False),
        sa.Column("consciousness_score", sa.Integer(), nullable=False),
        sa.Column(
            "metadata",
            JSONB,
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "logged_at",
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
    )
    op.create_index(
        "ix_activity_logs_firebase_uid", "activity_logs", ["firebase_uid"]
    )
    op.create_index(
        "ix_activity_logs_logged_at", "activity_logs", ["logged_at"]
    )

    # --- daily_summaries -----------------------------------------------
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
    op.create_index(
        "ix_daily_summaries_date", "daily_summaries", ["date"]
    )


def downgrade() -> None:
    op.drop_table("daily_summaries")
    op.drop_table("activity_logs")

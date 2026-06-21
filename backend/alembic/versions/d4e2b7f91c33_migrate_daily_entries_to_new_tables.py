"""migrate daily_entries into activity_logs and daily_summaries

Revision ID: d4e2b7f91c33
Revises: c3f1a9e84d12
Create Date: 2026-06-21

Data migration: moves all existing daily_entries rows into the new
activity_logs and daily_summaries tables, then drops daily_entries.

Each old entry becomes:
  - One activity_log row (type=legacy_entry, preserving transport/meal/energy)
  - One daily_summary row (aggregate_consciousness = the old carbon_consciousness)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision: str = "d4e2b7f91c33"
down_revision: Union[str, Sequence[str], None] = "c3f1a9e84d12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # --- Read all legacy entries ------------------------------------------
    rows = conn.execute(
        sa.text(
            """
            SELECT firebase_uid, date, transport_mode, meals_count,
                   energy_usage, carbon_consciousness, created_at
            FROM daily_entries
            ORDER BY date
            """
        )
    ).fetchall()

    if rows:
        # --- Insert into activity_logs ------------------------------------
        conn.execute(
            sa.text(
                """
                INSERT INTO activity_logs
                    (firebase_uid, activity_type, consciousness_score, metadata, logged_at)
                SELECT
                    firebase_uid,
                    'legacy_entry',
                    carbon_consciousness,
                    jsonb_build_object(
                        'transport',    COALESCE(transport_mode, ''),
                        'meals_count',  COALESCE(CAST(meals_count AS TEXT), ''),
                        'energy',       COALESCE(energy_usage, ''),
                        'source',       'migrated_from_daily_entries'
                    ),
                    created_at
                FROM daily_entries
                ON CONFLICT DO NOTHING
                """
            )
        )

        # --- Upsert into daily_summaries ----------------------------------
        # Group by (firebase_uid, date) and take the average score
        conn.execute(
            sa.text(
                """
                INSERT INTO daily_summaries
                    (firebase_uid, date, aggregate_consciousness, log_count, created_at, updated_at)
                SELECT
                    firebase_uid,
                    date,
                    ROUND(AVG(carbon_consciousness))::int,
                    COUNT(*),
                    MIN(created_at),
                    MAX(created_at)
                FROM daily_entries
                GROUP BY firebase_uid, date
                ON CONFLICT (firebase_uid, date) DO NOTHING
                """
            )
        )

    # --- Drop the old table and its constraint/index ----------------------
    op.drop_constraint("one_entry_per_day", "daily_entries", type_="unique")
    op.drop_table("daily_entries")


def downgrade() -> None:
    # Recreate daily_entries and restore data from daily_summaries
    op.create_table(
        "daily_entries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("firebase_uid", sa.String(length=128), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("transport_mode", sa.String(length=50), nullable=True),
        sa.Column("meals_count", sa.Integer(), nullable=True),
        sa.Column("energy_usage", sa.String(length=50), nullable=True),
        sa.Column("carbon_consciousness", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["firebase_uid"], ["users.firebase_uid"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("firebase_uid", "date", name="one_entry_per_day"),
    )

    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            INSERT INTO daily_entries (firebase_uid, date, carbon_consciousness, created_at)
            SELECT firebase_uid, date, aggregate_consciousness, created_at
            FROM daily_summaries
            ON CONFLICT DO NOTHING
            """
        )
    )

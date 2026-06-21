"""Daily carbon tracking summary model.

One row per user per day — holds the aggregated consciousness score
used to color the heatmap. Individual events live in activity_logs.
"""
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DailySummary(Base):
    """Aggregated daily score for the heatmap (one row per user per day)."""

    __tablename__ = "daily_summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    firebase_uid: Mapped[str] = mapped_column(
        String(128),
        ForeignKey("users.firebase_uid", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    # Rolling average of all activity_logs.consciousness_score for this day
    aggregate_consciousness: Mapped[int] = mapped_column(Integer, nullable=False)
    # Count of individual logs — useful for UI ("3 activities today")
    log_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        # Still unique per user per day — we aggregate here
        __import__("sqlalchemy").UniqueConstraint(
            "firebase_uid", "date", name="one_summary_per_day"
        ),
    )

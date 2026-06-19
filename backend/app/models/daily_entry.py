"""Daily carbon tracking entry model linked to Firebase UID."""
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DailyEntry(Base):
    """A single daily carbon tracking entry for a user."""

    __tablename__ = "daily_entries"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    firebase_uid: Mapped[str] = mapped_column(
        String(128),
        ForeignKey("users.firebase_uid"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    transport_mode: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    meals_count: Mapped[int | None] = mapped_column(
        nullable=True,
    )
    energy_usage: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    carbon_consciousness: Mapped[int] = mapped_column(
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("firebase_uid", "date", name="one_entry_per_day"),
    )

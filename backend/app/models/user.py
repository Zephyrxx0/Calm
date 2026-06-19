"""User model linked to Firebase UID."""
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    """Minimal user profile storing Firebase UID and optional display data."""

    __tablename__ = "users"

    firebase_uid: Mapped[str] = mapped_column(
        String(128),
        primary_key=True,
    )
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    display_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
    )

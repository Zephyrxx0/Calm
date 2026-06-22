"""Session and Message models for ephemeral interview tracking."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Session(Base):
    """Ephemeral interview session, identified by UUID (D-13)."""
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    firebase_uid: Mapped[str | None] = mapped_column(
        String(128),
        ForeignKey("users.firebase_uid"),
        nullable=True,
    )
    footprint_data: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
    )

    messages: Mapped[list["Message"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )


class Message(Base):
    """A single message in an interview session."""
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sessions.id"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(10), nullable=False)  # "user" or "ai"
    content: Mapped[str] = mapped_column(Text, nullable=False)

    session: Mapped["Session"] = relationship(back_populates="messages")



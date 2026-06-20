"""Snapshot model — static, shareable copy of a carbon report."""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Snapshot(Base):
    """Read-only snapshot of a user's carbon edition, shareable via UUID."""

    __tablename__ = "snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("sessions.id"), nullable=True
    )
    firebase_uid: Mapped[str | None] = mapped_column(String(128), ForeignKey("users.firebase_uid"), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

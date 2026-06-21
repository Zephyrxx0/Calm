"""Activity log model — individual tracking events for the daily system.

Each row is a single carbon activity (interview completion, quick form entry,
receipt scan, or chat reflection). Multiple rows can exist per user per day.
The daily_summaries table holds the aggregated score for the heatmap.
"""
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ActivityType(str, Enum):
    INTERVIEW = "interview"
    QUICK_LOG = "quick_log"
    RECEIPT_SCAN = "receipt_scan"
    CHAT_REFLECTION = "chat_reflection"


class ActivityLog(Base):
    """A single trackable carbon event for a user.

    The `metadata` JSONB column stores activity-specific data for the
    future Timeline view. Schema varies by activity_type:

    interview:
        {"mode": "quick"|"detailed", "total_tonnes": float, "session_id": str}

    quick_log:
        {"transport": str, "meal": str, "energy": str, "notes": str}

    receipt_scan:
        {"merchant": str, "items": [str], "ai_note": str, "image_url": str}

    chat_reflection:
        {"excerpt": str}  # first 200 chars of the reflection message
    """

    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    firebase_uid: Mapped[str] = mapped_column(
        String(128),
        ForeignKey("users.firebase_uid", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    activity_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    # 1-5 consciousness score contributed by this specific activity
    consciousness_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    # Rich JSON payload for future timeline view
    activity_metadata: Mapped[dict] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

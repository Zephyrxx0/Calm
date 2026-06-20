"""Snapshot API — create and retrieve static, shareable report snapshots."""
import uuid
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.firebase_auth import verify_firebase_token
from app.database import get_session
from app.models.daily_entry import DailyEntry
from app.models.session import Session as InterviewSession
from app.models.snapshot import Snapshot
from app.models.user import User
from app.services.benchmarks import BenchmarkService
from app.services.carbon_model import CarbonModel
from app.services.ai_coach import session_states

router = APIRouter()


# ---------------------------------------------------------------------------
# Streak computation helper
# ---------------------------------------------------------------------------

async def _compute_streak(
    firebase_uid: str, db: AsyncSession
) -> dict:
    """Compute current streak, longest streak, and total days for a user."""
    result = await db.execute(
        select(DailyEntry)
        .where(DailyEntry.firebase_uid == firebase_uid)
        .order_by(DailyEntry.date)
    )
    entries = result.scalars().all()
    entry_dates: dict[date, object] = {e.date: e for e in entries}
    all_dates = sorted(entry_dates.keys())

    # Current streak (consecutive days ending today)
    current_streak = 0
    check_date = date.today()
    while check_date in entry_dates:
        current_streak += 1
        check_date -= timedelta(days=1)

    # Longest streak
    longest_streak = 0
    if all_dates:
        streak = 1
        for i in range(1, len(all_dates)):
            if (all_dates[i] - all_dates[i - 1]).days == 1:
                streak += 1
            else:
                longest_streak = max(longest_streak, streak)
                streak = 1
        longest_streak = max(longest_streak, streak)

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_days": len(all_dates),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/snapshot")
async def create_snapshot(
    session_id: str,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_session),
):
    """Create a static snapshot of the edition for sharing.

    Fetches session data, computes footprint, and persists as JSONB payload.
    If an Authorization header with a valid Firebase token is present, the
    snapshot is linked to the authenticated user and includes streak data.
    Returns the snapshot UUID for public access.
    """
    # -- Optional Firebase auth --
    firebase_uid: Optional[str] = None
    user_data: Optional[dict] = None

    if authorization and authorization.startswith("Bearer "):
        token = authorization[len("Bearer "):]
        try:
            firebase_uid = await verify_firebase_token(token)
        except HTTPException:
            firebase_uid = None  # silently fall back to anonymous

    # -- Resolve session --
    uid = uuid.UUID(session_id)
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == uid)
        .options(selectinload(InterviewSession.messages))
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    # -- Compute footprint --
    state = session_states.get(session_id)
    extracted_data = state.extracted_data if state else {}
    model = CarbonModel()
    footprint_result = model.calculate(extracted_data)

    # -- Benchmarks --
    benchmarks = BenchmarkService().get_benchmarks()

    # -- Build payload --
    messages = [
        {"role": msg.role, "content": msg.content}
        for msg in sorted(session.messages, key=lambda m: m.id)
    ]

    payload: dict = {
        "session_id": session_id,
        "footprint": {
            "total_co2e": footprint_result.total_co2e,
            "breakdown": footprint_result.breakdown,
        },
        "messages": messages,
        "benchmarks": benchmarks,
    }

    # -- Firebase user enhancements --
    if firebase_uid:
        # Streak data
        streak = await _compute_streak(firebase_uid, db)
        payload["streak_data"] = streak

        # User metadata
        user_result = await db.execute(
            select(User).where(User.firebase_uid == firebase_uid)
        )
        user_model = user_result.scalar_one_or_none()
        if user_model:
            payload["user_metadata"] = {
                "display_name": user_model.display_name,
                "created_at": user_model.created_at.isoformat()
                if user_model.created_at
                else None,
            }

        # Enhanced stats: category breakdown ranked by streak context
        breakdown_sorted = sorted(
            footprint_result.breakdown.items(), key=lambda x: x[1], reverse=True
        )
        payload["enhanced_stats"] = {
            "top_category": breakdown_sorted[0][0] if breakdown_sorted else "",
            "category_breakdown": [
                {"name": name, "value": value}
                for name, value in breakdown_sorted
            ],
            "total_categories": len(breakdown_sorted),
            "streak_context": {
                "days_tracked": streak["total_days"],
                "current_streak": streak["current_streak"],
            },
        }

    # -- Persist --
    snapshot = Snapshot(
        session_id=uid,
        firebase_uid=firebase_uid,
        payload=payload,
    )
    db.add(snapshot)
    await db.commit()

    return {"snapshot_id": str(snapshot.id)}


@router.get("/snapshot/{snapshot_id}")
async def get_snapshot(
    snapshot_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Retrieve a stored snapshot payload by UUID.

    For Firebase-linked snapshots, includes streak data and user metadata.
    Anonymous session snapshots return the base payload only.
    """
    try:
        uid = uuid.UUID(snapshot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid snapshot ID")

    result = await db.execute(select(Snapshot).where(Snapshot.id == uid))
    snapshot = result.scalar_one_or_none()
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    # If snapshot has a linked Firebase user, include fresh streak data
    response = dict(snapshot.payload)
    if snapshot.firebase_uid:
        streak = await _compute_streak(snapshot.firebase_uid, db)
        response["streak_data"] = streak
        response["firebase_uid"] = snapshot.firebase_uid

    return response


@router.get("/snapshot/user/{firebase_uid}")
async def list_user_snapshots(
    firebase_uid: str,
    authorization: Optional[str] = Header(None),
    offset: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_session),
):
    """List snapshots for a specific Firebase user.

    The requesting user's Firebase UID must match the target UID.
    Returns a paginated list of snapshot metadata.
    """
    # -- Auth: verify the requestor matches the target user --
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    token = authorization[len("Bearer "):]
    try:
        requestor_uid = await verify_firebase_token(token)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Invalid token")

    if requestor_uid != firebase_uid:
        raise HTTPException(
            status_code=403, detail="Cannot access another user's snapshots"
        )

    # -- Count total --
    count_result = await db.execute(
        select(func.count(Snapshot.id)).where(
            Snapshot.firebase_uid == firebase_uid
        )
    )
    total = count_result.scalar() or 0

    # -- Fetch paginated --
    result = await db.execute(
        select(Snapshot)
        .where(Snapshot.firebase_uid == firebase_uid)
        .order_by(Snapshot.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    snapshots = result.scalars().all()

    items = []
    for snap in snapshots:
        items.append(
            {
                "snapshot_id": str(snap.id),
                "session_id": (
                    str(snap.session_id) if snap.session_id else None
                ),
                "created_at": snap.created_at.isoformat()
                if snap.created_at
                else None,
                "footprint_total": snap.payload.get("footprint", {}).get(
                    "total_co2e"
                ),
            }
        )

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": items,
    }

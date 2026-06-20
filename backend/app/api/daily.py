"""Daily carbon tracking API with Firebase auth integration."""
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.auth.firebase_auth import verify_firebase_token
from app.database import get_session
from app.models.daily_entry import DailyEntry
from app.models.user import User

router = APIRouter(prefix="/api/daily", tags=["daily"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class DailyEntryCreate(BaseModel):
    """Payload for creating a daily carbon tracking entry."""

    transport_mode: Optional[str] = None
    meals_count: Optional[int] = None
    energy_usage: Optional[str] = None
    carbon_consciousness: Optional[int] = Field(default=None, ge=1, le=5)


class DailyEntryResponse(BaseModel):
    """Serialised daily entry returned to the client."""

    id: int
    date: date
    transport_mode: Optional[str] = None
    meals_count: Optional[int] = None
    energy_usage: Optional[str] = None
    carbon_consciousness: int
    created_at: datetime


class ContributionData(BaseModel):
    """Single day in the contribution graph (GitHub-style heatmap)."""

    date: date
    carbon_consciousness: int  # 1-5 scale


class StreakResponse(BaseModel):
    """Aggregated streak and contribution information for a user."""

    current_streak: int
    longest_streak: int
    total_days: int
    entries: List[ContributionData]


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------

async def _get_current_user(authorization: str = Header(...)) -> str:
    """Extract Bearer token, verify with Firebase, return uid."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization[len("Bearer "):]
    return await verify_firebase_token(token)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _calculate_consciousness(entry: DailyEntryCreate) -> int:
    """Heuristic carbon-consciousness score when not explicitly provided."""
    if entry.carbon_consciousness is not None:
        return entry.carbon_consciousness

    score = 3  # neutral default

    transport = (entry.transport_mode or "").lower()
    if transport in ("walking", "bicycle", "public_transit", "ev"):
        score += 1
    elif transport in ("car", "flight", "truck"):
        score -= 1

    if entry.meals_count is not None:
        if entry.meals_count <= 1:
            score += 1
        elif entry.meals_count >= 4:
            score -= 1

    energy = (entry.energy_usage or "").lower()
    if energy in ("low", "solar", "renewable"):
        score += 1
    elif energy in ("high", "coal", "natural_gas"):
        score -= 1

    return max(1, min(5, score))


def _entry_response(entry: DailyEntry) -> DailyEntryResponse:
    """Map ORM object to Pydantic response model."""
    return DailyEntryResponse(
        id=entry.id,
        date=entry.date,
        transport_mode=entry.transport_mode,
        meals_count=entry.meals_count,
        energy_usage=entry.energy_usage,
        carbon_consciousness=entry.carbon_consciousness,
        created_at=entry.created_at,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=DailyEntryResponse, status_code=201)
async def create_daily_entry(
    entry_data: DailyEntryCreate,
    firebase_uid: str = Depends(_get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Create a daily carbon tracking entry (one per user per day)."""
    # Auto-create user if this is their first entry
    user_result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = user_result.scalar_one_or_none()
    if user is None:
        db.add(User(firebase_uid=firebase_uid))
        await db.flush()

    today = date.today()

    # Check for existing entry (avoid IntegrityError ambiguity with FK)
    existing = await db.execute(
        select(DailyEntry).where(
            DailyEntry.firebase_uid == firebase_uid,
            DailyEntry.date == today,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="Daily entry already exists for today",
        )

    consciousness = _calculate_consciousness(entry_data)

    daily_entry = DailyEntry(
        firebase_uid=firebase_uid,
        date=today,
        transport_mode=entry_data.transport_mode,
        meals_count=entry_data.meals_count,
        energy_usage=entry_data.energy_usage,
        carbon_consciousness=consciousness,
    )

    db.add(daily_entry)
    await db.commit()
    await db.refresh(daily_entry)

    return _entry_response(daily_entry)


@router.get("/streak", response_model=StreakResponse)
async def get_streak_data(
    firebase_uid: str = Depends(_get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Return the user's current streak, longest streak, and contribution graph."""
    result = await db.execute(
        select(DailyEntry)
        .where(DailyEntry.firebase_uid == firebase_uid)
        .order_by(DailyEntry.date)
    )
    entries = result.scalars().all()

    entry_dates: dict[date, DailyEntry] = {e.date: e for e in entries}
    all_dates = sorted(entry_dates.keys())

    # --- current streak (consecutive days ending today) ---
    current_streak = 0
    check_date = date.today()
    while check_date in entry_dates:
        current_streak += 1
        check_date -= timedelta(days=1)

    # --- longest streak ---
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

    # --- contribution graph (365-day window, chronological) ---
    today = date.today()
    contributions: List[ContributionData] = []
    for i in range(365):
        d = today - timedelta(days=365 - 1 - i)
        entry = entry_dates.get(d)
        consciousness = min(entry.carbon_consciousness, 4) if entry else 0
        contributions.append(ContributionData(date=d, carbon_consciousness=consciousness))

    return StreakResponse(
        current_streak=current_streak,
        longest_streak=longest_streak,
        total_days=len(entries),
        entries=contributions,
    )


@router.get("/entries", response_model=List[DailyEntryResponse])
async def get_daily_entries(
    firebase_uid: str = Depends(_get_current_user),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_session),
):
    """Return the user's daily entries, optionally filtered by date range."""
    query = select(DailyEntry).where(DailyEntry.firebase_uid == firebase_uid)

    if start_date:
        query = query.where(DailyEntry.date >= start_date)
    if end_date:
        query = query.where(DailyEntry.date <= end_date)

    query = query.order_by(DailyEntry.date.desc())
    result = await db.execute(query)
    entries = result.scalars().all()

    return [_entry_response(e) for e in entries]

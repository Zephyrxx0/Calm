"""Daily carbon tracking API — multi-log per day with aggregated heatmap.

Architecture:
  POST /api/daily/log          — create an activity log (any type, any time)
  GET  /api/daily/streak       — heatmap data + streaks (reads daily_summaries)
  GET  /api/daily/logs         — timeline-ready individual logs
  POST /api/daily/interview    — auto-called when interview completes (internal)
"""
from __future__ import annotations

import math
from datetime import date, datetime, timedelta, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.firebase_auth import verify_firebase_token
from app.database import get_session
from app.models.activity_log import ActivityLog, ActivityType
from app.models.daily_summary import DailySummary
from app.models.user import User

router = APIRouter(prefix="/api/daily", tags=["daily"])


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

async def _require_uid(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return await verify_firebase_token(authorization[len("Bearer "):])


async def _optional_uid(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return await verify_firebase_token(authorization[len("Bearer "):])
    except HTTPException:
        return None


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class QuickLogPayload(BaseModel):
    """Payload for a quick-form log entry."""
    transport: Optional[str] = None
    meal: Optional[str] = None
    energy: Optional[str] = None
    notes: Optional[str] = None
    consciousness_score: Optional[int] = Field(default=None, ge=1, le=5)


class ChatReflectionPayload(BaseModel):
    """Payload for a chat-reflection log entry."""
    message: str
    consciousness_score: int = Field(ge=1, le=5)


class InterviewLogPayload(BaseModel):
    """Auto-called when an interview finalises."""
    session_id: str
    total_tonnes: float
    mode: str = "quick"


class ActivityLogResponse(BaseModel):
    id: int
    activity_type: str
    consciousness_score: int
    metadata: dict
    logged_at: datetime


class TimelinePageResponse(BaseModel):
    items: List[ActivityLogResponse]
    next_cursor: Optional[int]  # ID to pass as before_id for next page; None = end


class ContributionData(BaseModel):
    date: date
    carbon_consciousness: int


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    total_days: int
    entries: List[ContributionData]


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _ensure_user(firebase_uid: str, db: AsyncSession) -> None:
    """Auto-create a user row if it doesn't exist yet."""
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    if result.scalar_one_or_none() is None:
        db.add(User(firebase_uid=firebase_uid))
        await db.flush()


async def _upsert_daily_summary(
    firebase_uid: str,
    target_date: date,
    new_score: int,
    db: AsyncSession,
) -> DailySummary:
    """Insert or update the daily summary, keeping a rolling average."""
    result = await db.execute(
        select(DailySummary).where(
            DailySummary.firebase_uid == firebase_uid,
            DailySummary.date == target_date,
        )
    )
    summary = result.scalar_one_or_none()

    if summary is None:
        summary = DailySummary(
            firebase_uid=firebase_uid,
            date=target_date,
            aggregate_consciousness=new_score,
            log_count=1,
        )
        db.add(summary)
    else:
        # Rolling average: (current_avg * count + new_score) / (count + 1)
        new_count = summary.log_count + 1
        new_avg = (summary.aggregate_consciousness * summary.log_count + new_score) / new_count
        summary.aggregate_consciousness = max(1, min(5, round(new_avg)))
        summary.log_count = new_count
        summary.updated_at = datetime.now(timezone.utc)

    return summary


def _score_quick_log(payload: QuickLogPayload) -> int:
    """Heuristic consciousness score from a quick-log form."""
    if payload.consciousness_score is not None:
        return payload.consciousness_score

    score = 3  # neutral baseline

    transport = (payload.transport or "").lower()
    if transport in ("bicycle", "walking", "public_transit", "ev", "train"):
        score += 1
    elif transport in ("car", "suv", "flight"):
        score -= 1

    meal = (payload.meal or "").lower()
    if meal in ("vegan", "vegetarian", "plant_based"):
        score += 1
    elif meal in ("red_meat", "beef", "lamb"):
        score -= 1

    energy = (payload.energy or "").lower()
    if energy in ("low", "solar", "renewable", "green"):
        score += 1
    elif energy in ("high", "coal", "gas"):
        score -= 1

    return max(1, min(5, score))


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/log/quick", status_code=201)
async def log_quick_entry(
    payload: QuickLogPayload,
    firebase_uid: str = Depends(_require_uid),
    db: AsyncSession = Depends(get_session),
) -> ActivityLogResponse:
    """Log a quick-form carbon activity."""
    await _ensure_user(firebase_uid, db)

    score = _score_quick_log(payload)
    today = date.today()

    log = ActivityLog(
        firebase_uid=firebase_uid,
        activity_type=ActivityType.QUICK_LOG,
        consciousness_score=score,
        activity_metadata={
            "transport": payload.transport,
            "meal": payload.meal,
            "energy": payload.energy,
            "notes": payload.notes,
        },
    )
    db.add(log)
    await _upsert_daily_summary(firebase_uid, today, score, db)
    await db.commit()
    await db.refresh(log)

    return ActivityLogResponse(
        id=log.id,
        activity_type=log.activity_type,
        consciousness_score=log.consciousness_score,
        metadata=log.activity_metadata,
        logged_at=log.logged_at,
    )


@router.post("/log/reflection", status_code=201)
async def log_chat_reflection(
    payload: ChatReflectionPayload,
    firebase_uid: str = Depends(_require_uid),
    db: AsyncSession = Depends(get_session),
) -> ActivityLogResponse:
    """Log a chat/reflection entry."""
    await _ensure_user(firebase_uid, db)

    today = date.today()
    log = ActivityLog(
        firebase_uid=firebase_uid,
        activity_type=ActivityType.CHAT_REFLECTION,
        consciousness_score=payload.consciousness_score,
        activity_metadata={
            "excerpt": payload.message[:200],
        },
    )
    db.add(log)
    await _upsert_daily_summary(firebase_uid, today, payload.consciousness_score, db)
    await db.commit()
    await db.refresh(log)

    return ActivityLogResponse(
        id=log.id,
        activity_type=log.activity_type,
        consciousness_score=log.consciousness_score,
        metadata=log.activity_metadata,
        logged_at=log.logged_at,
    )


@router.post("/log/interview", status_code=201)
async def log_interview_completion(
    payload: InterviewLogPayload,
    firebase_uid: Optional[str] = Depends(_optional_uid),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Auto-called when an interview finalises. Logs a high-consciousness entry.

    Completing the onboarding interview is a deeply conscious act — it's
    automatically scored as a 5 (Extremely conscious) for today.
    """
    if not firebase_uid:
        return {"status": "skipped", "reason": "unauthenticated"}

    await _ensure_user(firebase_uid, db)

    # Completing the interview is always a 5 — it's the most intentional act
    score = 5
    today = date.today()

    log = ActivityLog(
        firebase_uid=firebase_uid,
        activity_type=ActivityType.INTERVIEW,
        consciousness_score=score,
        activity_metadata={
            "session_id": payload.session_id,
            "total_tonnes": payload.total_tonnes,
            "mode": payload.mode,
        },
    )
    db.add(log)
    await _upsert_daily_summary(firebase_uid, today, score, db)
    await db.commit()

    return {"status": "ok"}


@router.post("/log/receipt", status_code=201)
async def log_receipt_scan(
    firebase_uid: str = Depends(_require_uid),
    db: AsyncSession = Depends(get_session),
    file: UploadFile = File(...),
    merchant: Optional[str] = Form(None),
) -> ActivityLogResponse:
    """Upload a receipt image for AI analysis and log the result.

    The image is passed to Gemini Vision to extract items and estimate
    the carbon footprint. Score is derived from purchase patterns.
    """
    await _ensure_user(firebase_uid, db)

    # Read image bytes for Gemini analysis
    image_bytes = await file.read()

    # --- Gemini Vision Analysis ---
    score, items, ai_note = await _analyze_receipt_with_gemini(image_bytes, file.content_type)

    today = date.today()
    log = ActivityLog(
        firebase_uid=firebase_uid,
        activity_type=ActivityType.RECEIPT_SCAN,
        consciousness_score=score,
        activity_metadata={
            "merchant": merchant or "Unknown",
            "items": items,
            "ai_note": ai_note,
            "filename": file.filename,
        },
    )
    db.add(log)
    await _upsert_daily_summary(firebase_uid, today, score, db)
    await db.commit()
    await db.refresh(log)

    return ActivityLogResponse(
        id=log.id,
        activity_type=log.activity_type,
        consciousness_score=log.consciousness_score,
        metadata=log.activity_metadata,
        logged_at=log.logged_at,
    )


async def _analyze_receipt_with_gemini(
    image_bytes: bytes,
    content_type: Optional[str],
) -> tuple[int, list[str], str]:
    """Send receipt image to Gemini Vision, extract items and score."""
    import os, json as _json
    import google.generativeai as genai

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return 3, [], "Receipt analysis unavailable (no API key configured)."

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = """You are a carbon footprint analyst. Analyse this receipt image.
Return a JSON object with exactly these fields:
{
  "items": ["list", "of", "purchased", "items"],
  "consciousness_score": <integer 1-5 where 1=very high carbon, 5=very low carbon>,
  "ai_note": "one encouraging sentence about the purchase, max 100 chars"
}
Consider: plant-based foods, local produce, and sustainable products increase the score.
Red meat, processed foods, flights, and fast fashion decrease it.
Respond ONLY with the JSON object, no markdown."""

    mime = content_type or "image/jpeg"
    image_part = {"mime_type": mime, "data": image_bytes}

    try:
        response = model.generate_content([prompt, image_part])
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = _json.loads(text)
        return (
            max(1, min(5, int(data.get("consciousness_score", 3)))),
            data.get("items", []),
            data.get("ai_note", ""),
        )
    except Exception:
        return 3, [], "Could not analyse receipt — logged with neutral score."


# ---------------------------------------------------------------------------
# Read endpoints
# ---------------------------------------------------------------------------

@router.get("/streak", response_model=StreakResponse)
async def get_streak_data(
    firebase_uid: str = Depends(_require_uid),
    db: AsyncSession = Depends(get_session),
) -> StreakResponse:
    """Return the user's current streak, longest streak, and contribution graph.

    Reads from daily_summaries for O(days) performance.
    """
    result = await db.execute(
        select(DailySummary)
        .where(DailySummary.firebase_uid == firebase_uid)
        .order_by(DailySummary.date)
    )
    summaries = result.scalars().all()

    entry_dates: dict[date, int] = {
        s.date: s.aggregate_consciousness for s in summaries
    }
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

    # 365-day contribution window
    today = date.today()
    contributions: List[ContributionData] = []
    for i in range(365):
        d = today - timedelta(days=365 - 1 - i)
        summary = entry_dates.get(d)
        consciousness = min(entry_dates[d], 4) if d in entry_dates else 0
        contributions.append(ContributionData(date=d, carbon_consciousness=consciousness))

    return StreakResponse(
        current_streak=current_streak,
        longest_streak=longest_streak,
        total_days=len(all_dates),
        entries=contributions,
    )


@router.get("/logs", response_model=TimelinePageResponse)
async def get_activity_logs(
    firebase_uid: str = Depends(_require_uid),
    db: AsyncSession = Depends(get_session),
    before_id: Optional[int] = None,
    limit: int = 20,
) -> TimelinePageResponse:
    """Return paginated individual activity logs for the timeline view.

    Cursor-based pagination: pass `before_id` to fetch items older than that
    activity log ID. Returns `next_cursor=None` when no more items exist.
    """
    limit = max(1, min(limit, 50))  # clamp to [1, 50]

    query = (
        select(ActivityLog)
        .where(ActivityLog.firebase_uid == firebase_uid)
        .order_by(ActivityLog.id.desc())
    )
    if before_id is not None:
        query = query.where(ActivityLog.id < before_id)

    # Fetch one extra to determine if there's a next page
    result = await db.execute(query.limit(limit + 1))
    rows = result.scalars().all()

    has_more = len(rows) > limit
    rows = rows[:limit]

    items = [
        ActivityLogResponse(
            id=log.id,
            activity_type=log.activity_type,
            consciousness_score=log.consciousness_score,
            metadata=log.activity_metadata,
            logged_at=log.logged_at,
        )
        for log in rows
    ]

    return TimelinePageResponse(
        items=items,
        next_cursor=rows[-1].id if has_more else None,
    )

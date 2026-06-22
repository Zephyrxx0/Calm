"""Daily carbon tracking API — multi-log per day with aggregated heatmap.

Architecture:
  POST /api/daily/log/quick       — log a quick-form carbon activity
  POST /api/daily/log/reflection  — log a chat-style reflection
  POST /api/daily/log/receipt     — log an AI-analysed receipt
  POST /api/daily/log/interview   — auto-called when interview finalises
  GET  /api/daily/logs            — timeline-ready paginated activity logs
  GET  /api/daily/streak          — heatmap (count-based) + streak stats

Single source of truth: the `activity_logs` table. Both the timeline and the
heatmap derive from the same rows — the heatmap aggregates them per day.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.firebase_auth import verify_firebase_token
from app.database import get_session
from app.models.activity_log import ActivityLog, ActivityType
from app.models.user import User

router = APIRouter(prefix="/daily", tags=["daily"])


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

    log = ActivityLog(
        firebase_uid=firebase_uid,
        activity_type=ActivityType.CHAT_REFLECTION,
        consciousness_score=payload.consciousness_score,
        activity_metadata={
            "excerpt": payload.message[:200],
        },
    )
    db.add(log)
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

    Computed directly from activity_logs — one row per logged event. The
    heatmap intensity reflects the *number of events* on a given day, mapped
    to a 0..4 scale (so the timeline and heatmap share a single source of
    truth).
    """
    # Group activity logs by calendar day (server tz) and count events.
    day_col = sqlfunc.date(ActivityLog.logged_at).label("day")
    result = await db.execute(
        select(day_col, sqlfunc.count(ActivityLog.id).label("cnt"))
        .where(ActivityLog.firebase_uid == firebase_uid)
        .group_by(day_col)
        .order_by(day_col)
    )
    # Normalise day to a Python `date` — SQLite returns str, Postgres returns date.
    counts_by_date: dict[date, int] = {}
    for row in result.all():
        day_val = row.day
        if isinstance(day_val, str):
            day_val = date.fromisoformat(day_val)
        counts_by_date[day_val] = row.cnt
    all_dates = sorted(counts_by_date.keys())

    # Current streak (consecutive days ending today)
    current_streak = 0
    check_date = date.today()
    while check_date in counts_by_date:
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

    # 365-day contribution window — intensity = bucketed event count.
    today = date.today()
    contributions: List[ContributionData] = []
    for i in range(365):
        d = today - timedelta(days=365 - 1 - i)
        cnt = counts_by_date.get(d, 0)
        intensity = _count_to_intensity(cnt)
        contributions.append(ContributionData(date=d, carbon_consciousness=intensity))

    return StreakResponse(
        current_streak=current_streak,
        longest_streak=longest_streak,
        total_days=len(all_dates),
        entries=contributions,
    )


def _count_to_intensity(count: int) -> int:
    """Map a daily event count to a 0..4 heatmap intensity bucket.

    0       → 0  (no entry, page background)
    1       → 1  (faint warm)
    2..3    → 2  (light terracotta)
    4..6    → 3  (medium terracotta)
    7+      → 4  (deep terracotta)
    """
    if count <= 0:
        return 0
    if count == 1:
        return 1
    if count <= 3:
        return 2
    if count <= 6:
        return 3
    return 4

@router.get("/analysis")
async def get_daily_analysis(
    target_date: Optional[date] = None,
    firebase_uid: str = Depends(_require_uid),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Generate a one-liner Gemini analysis of the activities logged on target_date (defaults to today)."""
    if target_date is None:
        target_date = date.today()

    day_start = datetime.combine(target_date, datetime.min.time())
    day_end = datetime.combine(target_date, datetime.max.time())

    query = (
        select(ActivityLog)
        .where(ActivityLog.firebase_uid == firebase_uid)
        .where(ActivityLog.logged_at >= day_start)
        .where(ActivityLog.logged_at <= day_end)
    )
    result = await db.execute(query)
    logs = result.scalars().all()

    if not logs:
        return {"analysis": "No carbon tracking activities recorded today yet."}

    summary_parts = []
    for log in logs:
        t_type = log.activity_type
        m = log.activity_metadata
        score = log.consciousness_score
        
        if t_type == "quick_log":
            parts = []
            if m.get("transport"): parts.append(f"transport: {m['transport']}")
            if m.get("meal"): parts.append(f"meal: {m['meal']}")
            if m.get("energy"): parts.append(f"energy: {m['energy']}")
            summary_parts.append(f"Quick Log ({', '.join(parts)}) [Score: {score}/5]")
        elif t_type == "chat_reflection":
            summary_parts.append(f"Reflection: '{m.get('excerpt', '')}' [Score: {score}/5]")
        elif t_type == "receipt_scan":
            summary_parts.append(f"Scanned receipt from {m.get('merchant', 'merchant')} listing: {', '.join(m.get('items', []))} [Score: {score}/5]")
        elif t_type == "interview":
            summary_parts.append(f"Completed initial carbon interview [Score: {score}/5]")
            
    summary_text = "; ".join(summary_parts)

    import os
    from google import genai
    
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        avg_score = sum(l.consciousness_score for l in logs) / len(logs)
        if avg_score >= 4.0:
            return {"analysis": "You're making highly conscious environmental choices today. Keep it up!"}
        elif avg_score >= 2.5:
            return {"analysis": "A balanced day of carbon consciousness. Consider swapping high-emission travel options."}
        else:
            return {"analysis": "Your logged activities today show room for greener choices. Small steps add up!"}

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""You are a supportive, calm environmental coach. 
Write a constructive, single-sentence (1-liner) summary and feedback of the user's logged carbon activities for today.
Focus on being encouraging, pointing out positive actions and gently noting areas for improvement if any. Keep it under 120 characters.

Here is the log of their activities:
{summary_text}

Response must be ONLY the single sentence, plain text, no quotes, no markdown."""

        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt,
        )
        analysis_text = response.text.strip()
        if (analysis_text.startswith('"') and analysis_text.endswith('"')) or \
           (analysis_text.startswith("'") and analysis_text.endswith("'")):
            analysis_text = analysis_text[1:-1]
        return {"analysis": analysis_text}
    except Exception:
        avg_score = sum(l.consciousness_score for l in logs) / len(logs)
        if avg_score >= 4.0:
            return {"analysis": "You're making highly conscious environmental choices today. Keep it up!"}
        elif avg_score >= 2.5:
            return {"analysis": "A balanced day of carbon consciousness. Consider swapping high-emission travel options."}
        else:
            return {"analysis": "Your logged activities today show room for greener choices. Small steps add up!"}


@router.get("/logs", response_model=TimelinePageResponse)
async def get_activity_logs(
    firebase_uid: str = Depends(_require_uid),
    db: AsyncSession = Depends(get_session),
    before_id: Optional[int] = None,
    limit: int = 20,
    target_date: Optional[date] = None,
) -> TimelinePageResponse:
    """Return paginated individual activity logs for the timeline view.

    Cursor-based pagination: pass `before_id` to fetch items older than that
    activity log ID. Returns `next_cursor=None` when no more items exist.
    Pass `target_date` (YYYY-MM-DD) to filter to a specific day.
    """
    limit = max(1, min(limit, 50))  # clamp to [1, 50]

    query = (
        select(ActivityLog)
        .where(ActivityLog.firebase_uid == firebase_uid)
        .order_by(ActivityLog.id.desc())
    )
    if before_id is not None:
        query = query.where(ActivityLog.id < before_id)
    if target_date is not None:
        query = query.where(
            sqlfunc.date(ActivityLog.logged_at) == target_date
        )

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

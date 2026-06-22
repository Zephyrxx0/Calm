"""Interview API — session creation, chat SSE streaming, and AI coach integration."""
import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.firebase_auth import verify_firebase_token
from app.database import get_session
from app.models.session import Message, Session as InterviewSession
from app.models.user import User
from app.services.ai_coach import AICoach, InterviewState, session_states
from app.services.carbon_model import CarbonModel
from app.models.activity_log import ActivityLog, ActivityType

router = APIRouter()


def get_ai_coach() -> AICoach:
    """Factory for AICoach — overridable in tests via patch."""
    return AICoach()


class MessageInput(BaseModel):
    """Request body for POST /message."""
    message: str


async def _get_optional_uid(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract Firebase UID if auth header present, otherwise None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[len("Bearer "):]
    try:
        return await verify_firebase_token(token)
    except HTTPException:
        return None


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/interview/start")
async def start_interview(
    db: AsyncSession = Depends(get_session),
    firebase_uid: Optional[str] = Depends(_get_optional_uid),
):
    """Create a new interview session, optionally linked to Firebase user."""
    # Ensure user exists if authenticated
    if firebase_uid:
        result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
        if not result.scalar_one_or_none():
            user = User(firebase_uid=firebase_uid)
            db.add(user)
            await db.commit()

    session = InterviewSession(firebase_uid=firebase_uid)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    s_id = session.id

    # Initialize interview state
    state = InterviewState()
    session_states[str(s_id)] = state

    # Generate initial greeting/question
    coach = get_ai_coach()
    ai_result = await coach.generate_response(state, "")

    # Save AI greeting to DB
    ai_msg = Message(session_id=s_id, role="ai", content=ai_result["text"])
    db.add(ai_msg)
    await db.commit()

    return {
        "session_id": str(s_id),
        "initial_message": ai_result["text"],
    }


@router.post("/interview/{session_id}/message")
async def chat_message(
    session_id: str,
    body: MessageInput,
    db: AsyncSession = Depends(get_session),
):
    """Receive user message, call AI Coach, return SSE stream."""
    uid = uuid.UUID(session_id)
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == uid)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    user_msg = Message(session_id=uid, role="user", content=body.message)
    db.add(user_msg)
    await db.commit()

    # Get or create interview state
    state = session_states.get(session_id, InterviewState())

    # Call AI Coach
    coach = get_ai_coach()
    ai_result = await coach.generate_response(state, body.message)

    # Save AI response
    ai_msg = Message(session_id=uid, role="ai", content=ai_result["text"])
    db.add(ai_msg)
    await db.commit()

    # Update stored state
    session_states[session_id] = state

    # If interview complete, persist footprint data to session
    if ai_result["is_complete"]:
        model = CarbonModel()
        footprint = model.calculate(state.extracted_data)
        session.footprint_data = {
            "total_co2e": footprint.total_co2e,
            "breakdown": footprint.breakdown,
            "extracted_data": state.extracted_data,
        }
        await db.commit()

    # Stream response as SSE
    async def event_stream():
        text_json = json.dumps(ai_result["text"])
        yield f"0:{text_json}\n"
        if ai_result["is_complete"]:
            finish_data = json.dumps({"is_complete": True})
            yield f"e:{finish_data}\n"
        yield "d\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


class FinalizeInput(BaseModel):
    """Request body for POST /finalize — persists interview results to DB."""
    total_tonnes: float
    breakdown: dict
    mode: str = "quick"
    messages: list[dict] = []


@router.post("/interview/{session_id}/finalize")
async def finalize_interview(
    session_id: str,
    data: FinalizeInput,
    db: AsyncSession = Depends(get_session),
    authorization: Optional[str] = Header(None),
):
    """Persist interview session + messages + footprint to PostgreSQL.

    Called by the frontend when the calm-agent emits end_chat data.
    Enables /report/{session_id} to look up the session in the DB.
    """
    try:
        uid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id")

    # Extract firebase_uid if auth present
    firebase_uid = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[len("Bearer "):]
        try:
            firebase_uid = await verify_firebase_token(token)
        except HTTPException:
            pass

    # Check if session already exists (idempotent)
    existing = await db.execute(
        select(InterviewSession).where(InterviewSession.id == uid)
    )
    session = existing.scalar_one_or_none()
    is_new_session = session is None

    if is_new_session:
        # Auto-create user if authenticated
        if firebase_uid:
            user_result = await db.execute(
                select(User).where(User.firebase_uid == firebase_uid)
            )
            if user_result.scalar_one_or_none() is None:
                db.add(User(firebase_uid=firebase_uid))
                await db.flush()

        session = InterviewSession(
            id=uid,
            firebase_uid=firebase_uid,
            footprint_data={
                "total_co2e": data.total_tonnes * 1000,
                "breakdown": data.breakdown,
                "mode": data.mode,
            },
        )
        db.add(session)
        await db.flush()

        for msg in data.messages:
            db.add(Message(
                session_id=uid,
                role=msg.get("role", "user"),
                content=msg.get("content", ""),
            ))
    else:
        # Update existing session with footprint data
        session.footprint_data = {
            "total_co2e": data.total_tonnes * 1000,
            "breakdown": data.breakdown,
            "mode": data.mode,
        }

    await db.commit()

    # --- Auto-log interview completion into daily tracking ---
    # Only log on the *first* successful finalize for this session — guarantees
    # one ActivityLog row per interview, regardless of how many times the
    # frontend retries the request.
    if firebase_uid and is_new_session:
        log = ActivityLog(
            firebase_uid=firebase_uid,
            activity_type=ActivityType.INTERVIEW,
            consciousness_score=5,  # interview = most intentional carbon act
            activity_metadata={
                "session_id": session_id,
                "total_tonnes": data.total_tonnes,
                "mode": data.mode,
            },
        )
        db.add(log)
        await db.commit()

    return {"status": "ok", "session_id": session_id}

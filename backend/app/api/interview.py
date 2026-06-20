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

    # Initialize interview state
    state = InterviewState()
    session_states[str(session.id)] = state

    # Generate initial greeting/question
    coach = get_ai_coach()
    ai_result = await coach.generate_response(state, "")

    # Save AI greeting to DB
    ai_msg = Message(session_id=session.id, role="ai", content=ai_result["text"])
    db.add(ai_msg)
    await db.commit()

    return {
        "session_id": str(session.id),
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

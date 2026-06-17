"""Interview API — session creation, chat SSE streaming, and AI coach integration."""
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.session import Message, Session as InterviewSession
from app.services.ai_coach import AICoach, InterviewState, session_states

router = APIRouter()


def get_ai_coach() -> AICoach:
    """Factory for AICoach — overridable in tests via patch."""
    return AICoach()


class MessageInput(BaseModel):
    """Request body for POST /message."""
    message: str


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/interview/start")
async def start_interview(db: AsyncSession = Depends(get_session)):
    """Create a new ephemeral interview session and return its UUID."""
    session = InterviewSession()
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Initialize interview state
    session_states[str(session.id)] = InterviewState()

    return {"session_id": str(session.id)}


@router.post("/interview/{session_id}/message")
async def chat_message(
    session_id: str,
    body: MessageInput,
    db: AsyncSession = Depends(get_session),
):
    """Receive user message, call AI Coach, return SSE stream (Vercel AI SDK protocol).

    SSE format (Vercel AI SDK Data Stream Protocol):
    - 0:"text chunk" for text parts
    - d for done marker
    """
    # Validate session exists
    uid = uuid.UUID(session_id)
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == uid)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message to DB
    user_msg = Message(session_id=uid, role="user", content=body.message)
    db.add(user_msg)
    await db.commit()

    # Get or create interview state
    state = session_states.get(session_id, InterviewState())

    # Call AI Coach
    coach = get_ai_coach()
    ai_result = await coach.generate_response(state, body.message)

    # Save AI response to DB
    ai_msg = Message(session_id=uid, role="ai", content=ai_result["text"])
    db.add(ai_msg)
    await db.commit()

    # Update stored state
    session_states[session_id] = state

    # Stream response as SSE (Vercel AI SDK Data Stream Protocol)
    async def event_stream():
        # Send text as a single chunk (0:"text")
        text_json = json.dumps(ai_result["text"])
        yield f"0:{text_json}\n"

        # If interview complete, send finish data
        if ai_result["is_complete"]:
            finish_data = json.dumps({"is_complete": True})
            yield f"e:{finish_data}\n"

        # Done marker
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

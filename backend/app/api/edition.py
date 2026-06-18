"""Edition API — serves the personalized newspaper data for a completed interview."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.session import Message, Session as InterviewSession
from app.services.ai_coach import session_states
from app.services.carbon_model import CarbonModel
from app.services.benchmarks import BenchmarkService
from app.services.insights import InsightsService

router = APIRouter()


@router.get("/edition/{session_id}")
async def get_edition(
    session_id: str,
    country: str = Query(default="Global", description="Country for benchmark comparison"),
    db: AsyncSession = Depends(get_session),
):
    """Retrieve session data, compute footprint, and return Edition payload.

    Returns:
        {
            "session_id": "...",
            "footprint": {"total_co2e": float, "breakdown": {...}},
            "messages": [{"role": "user"|"ai", "content": "..."}],
            "quotes": ["pull quote 1", "pull quote 2"],
            "benchmarks": {"global": float, "national": float, "label": str},
            "insights": {"summary": str, "recommendations": [str]}
        }
    """
    # Validate session exists
    uid = uuid.UUID(session_id)
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == uid)
        .options(selectinload(InterviewSession.messages))
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get extracted data from interview state
    state = session_states.get(session_id)
    extracted_data = state.extracted_data if state else {}

    # Compute footprint
    model = CarbonModel()
    footprint_result = model.calculate(extracted_data)

    # Get benchmarks
    benchmarks = BenchmarkService().get_benchmarks(country)

    # Get AI insights
    insights_svc = InsightsService()
    insights = await insights_svc.get_insights(
        footprint_result.breakdown, footprint_result.total_co2e
    )

    # Build messages list
    messages = [
        {"role": msg.role, "content": msg.content}
        for msg in sorted(session.messages, key=lambda m: m.id)
    ]

    # Extract 1-2 pull quotes from user messages
    quotes = _extract_quotes(messages)

    return {
        "session_id": session_id,
        "footprint": {
            "total_co2e": footprint_result.total_co2e,
            "breakdown": footprint_result.breakdown,
        },
        "messages": messages,
        "quotes": quotes,
        "benchmarks": benchmarks,
        "insights": insights,
    }


def _extract_quotes(messages: list[dict], max_quotes: int = 2) -> list[str]:
    """Extract 1-2 interesting pull quotes from user messages."""
    user_messages = [m["content"] for m in messages if m["role"] == "user" and len(m["content"]) > 10]
    if not user_messages:
        return []
    sorted_msgs = sorted(user_messages, key=len, reverse=True)
    return sorted_msgs[:max_quotes]

"""Snapshot API — create and retrieve static, shareable report snapshots."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.session import Session as InterviewSession
from app.models.snapshot import Snapshot
from app.services.benchmarks import BenchmarkService
from app.services.carbon_model import CarbonModel
from app.services.ai_coach import session_states

router = APIRouter()


@router.post("/snapshot")
async def create_snapshot(
    session_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Create a static snapshot of the edition for sharing.

    Fetches session data, computes footprint, and persists as JSONB payload.
    Returns the snapshot UUID for public access.
    """
    uid = uuid.UUID(session_id)
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == uid)
        .options(selectinload(InterviewSession.messages))
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    # Compute footprint
    state = session_states.get(session_id)
    extracted_data = state.extracted_data if state else {}
    model = CarbonModel()
    footprint_result = model.calculate(extracted_data)

    # Get benchmarks
    benchmarks = BenchmarkService().get_benchmarks()

    # Build payload
    messages = [
        {"role": msg.role, "content": msg.content}
        for msg in sorted(session.messages, key=lambda m: m.id)
    ]

    payload = {
        "session_id": session_id,
        "footprint": {
            "total_co2e": footprint_result.total_co2e,
            "breakdown": footprint_result.breakdown,
        },
        "messages": messages,
        "benchmarks": benchmarks,
    }

    snapshot = Snapshot(session_id=uid, payload=payload)
    db.add(snapshot)
    await db.commit()

    return {"snapshot_id": str(snapshot.id)}


@router.get("/snapshot/{snapshot_id}")
async def get_snapshot(
    snapshot_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Retrieve a stored snapshot payload by UUID."""
    try:
        uid = uuid.UUID(snapshot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid snapshot ID")

    result = await db.execute(select(Snapshot).where(Snapshot.id == uid))
    snapshot = result.scalar_one_or_none()
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    return snapshot.payload

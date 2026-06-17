from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.session import Session as InterviewSession

router = APIRouter()


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
    return {"session_id": str(session.id)}

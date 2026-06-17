"""Ledger API — file upload, carbon extraction, and footprint recalculation."""
import os
import tempfile
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.session import LedgerEntry, Session as InterviewSession
from app.services.scanner import scan_receipt_or_bill

router = APIRouter()


@router.post("/ledger/upload/{session_id}")
async def upload_receipt(
    session_id: str,
    file: UploadFile,
    db: AsyncSession = Depends(get_session),
):
    """Upload a receipt/bill, extract carbon data, recalculate footprint."""
    uid = uuid.UUID(session_id)
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == uid)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    # Spool upload to temp file
    suffix = os.path.splitext(file.filename or "")[1]
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        content = await file.read()
        tmp.write(content)
        tmp.close()

        data = await scan_receipt_or_bill(tmp.name, file.content_type or "image/jpeg")
    finally:
        os.unlink(tmp.name)

    # Create ledger entry
    entry = LedgerEntry(
        session_id=uid,
        description=data["description"],
        category=data["category"],
        carbon_impact=data["carbon_impact"],
    )
    db.add(entry)
    await db.commit()

    # Recalculate totals
    totals = await _calculate_footprint(db, uid)
    return {"entry": _entry_dict(entry), **totals}


@router.get("/ledger/{session_id}")
async def get_ledger(
    session_id: str,
    db: AsyncSession = Depends(get_session),
):
    """Retrieve all ledger entries and recalculated footprint for a session."""
    uid = uuid.UUID(session_id)
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == uid)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Session not found")

    entries_result = await db.execute(
        select(LedgerEntry).where(LedgerEntry.session_id == uid)
    )
    entries = entries_result.scalars().all()

    totals = await _calculate_footprint(db, uid)
    return {
        "entries": [_entry_dict(e) for e in entries],
        **totals,
    }


async def _calculate_footprint(db: AsyncSession, session_id: uuid.UUID) -> dict:
    """Calculate total footprint and category breakdown from ledger entries."""
    result = await db.execute(
        select(LedgerEntry).where(LedgerEntry.session_id == session_id)
    )
    entries = result.scalars().all()

    total = sum(e.carbon_impact for e in entries)
    breakdown: dict[str, float] = {}
    for e in entries:
        breakdown[e.category] = breakdown.get(e.category, 0) + e.carbon_impact

    return {"total_footprint": total, "category_breakdown": breakdown}


def _entry_dict(entry: LedgerEntry) -> dict:
    return {
        "id": entry.id,
        "description": entry.description,
        "category": entry.category,
        "carbon_impact": entry.carbon_impact,
    }

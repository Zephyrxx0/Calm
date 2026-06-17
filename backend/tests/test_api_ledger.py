"""Integration tests for the Ledger API endpoints."""
import io
import uuid
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.database import Base, get_session
from app.main import app
from app.models.session import Session as InterviewSession, LedgerEntry


@pytest_asyncio.fixture
async def db_session():
    """In-memory SQLite for testing."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSession(engine) as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session):
    """Test client with overridden DB dependency."""
    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def session_id(db_session):
    """Create a test session and return its UUID string."""
    session = InterviewSession()
    db_session.add(session)
    await db_session.commit()
    await db_session.refresh(session)
    return str(session.id)


@pytest.mark.asyncio
async def test_upload_receipt(client, session_id):
    """POST /api/ledger/upload/{session_id} extracts data and returns totals."""
    mock_scan = AsyncMock(return_value={
        "description": "Grocery run",
        "category": "Food",
        "carbon_impact": 8.3,
    })

    with patch("app.api.ledger.scan_receipt_or_bill", mock_scan):
        resp = await client.post(
            f"/api/ledger/upload/{session_id}",
            files={"file": ("receipt.jpg", io.BytesIO(b"fake"), "image/jpeg")},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["entry"]["description"] == "Grocery run"
    assert data["entry"]["carbon_impact"] == 8.3
    assert data["total_footprint"] == 8.3
    assert data["category_breakdown"] == {"Food": 8.3}


@pytest.mark.asyncio
async def test_get_ledger_entries(client, session_id, db_session):
    """GET /api/ledger/{session_id} returns entries and totals."""
    uid = uuid.UUID(session_id)
    db_session.add_all([
        LedgerEntry(session_id=uid, description="Electricity", category="Energy", carbon_impact=40.0),
        LedgerEntry(session_id=uid, description="Bus pass", category="Transport", carbon_impact=5.0),
    ])
    await db_session.commit()

    resp = await client.get(f"/api/ledger/{session_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["entries"]) == 2
    assert data["total_footprint"] == 45.0
    assert data["category_breakdown"] == {"Energy": 40.0, "Transport": 5.0}


@pytest.mark.asyncio
async def test_upload_404_unknown_session(client):
    """Upload to non-existent session returns 404."""
    fake_id = str(uuid.uuid4())
    with patch("app.api.ledger.scan_receipt_or_bill", AsyncMock()):
        resp = await client.post(
            f"/api/ledger/upload/{fake_id}",
            files={"file": ("receipt.jpg", io.BytesIO(b"fake"), "image/jpeg")},
        )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_ledger_404_unknown_session(client):
    """GET non-existent session returns 404."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/api/ledger/{fake_id}")
    assert resp.status_code == 404

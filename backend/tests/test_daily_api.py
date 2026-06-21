"""Integration tests for the new Daily Tracking multi-log API endpoints."""
from datetime import date, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.database import Base, get_session
from app.main import app
from app.models.user import User
from app.models.activity_log import ActivityLog, ActivityType
from app.models.daily_summary import DailySummary


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


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
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _auth_mock(uid: str = "test_uid") -> AsyncMock:
    """Return an AsyncMock that resolves to *uid* (simulates valid token)."""
    return AsyncMock(return_value=uid)


def _auth_mock_failing() -> AsyncMock:
    """Return an AsyncMock that raises 401 (simulates invalid token)."""
    return AsyncMock(side_effect=HTTPException(status_code=401, detail="Invalid token"))


_AUTH_HEADERS = {"Authorization": "Bearer fake-test-token"}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_log_quick_entry_success(client, db_session):
    """POST /api/daily/log/quick with valid auth and payload logs activity and updates summary."""
    payload = {
        "transport": "bicycle",
        "meal": "vegan",
        "energy": "low",
        "notes": "Rode bike to work and had a vegan salad.",
        "consciousness_score": 5,
    }
    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.post(
            "/api/daily/log/quick", json=payload, headers=_AUTH_HEADERS
        )

    assert resp.status_code == 201
    data = resp.json()
    assert data["activity_type"] == "quick_log"
    assert data["consciousness_score"] == 5
    assert data["metadata"]["transport"] == "bicycle"
    assert data["metadata"]["meal"] == "vegan"
    assert "id" in data

    # Verify database state
    stmt = select(ActivityLog).where(ActivityLog.firebase_uid == "test_uid")
    logs = (await db_session.execute(stmt)).scalars().all()
    assert len(logs) == 1
    assert logs[0].consciousness_score == 5

    # Verify DailySummary was created
    stmt_sum = select(DailySummary).where(DailySummary.firebase_uid == "test_uid")
    summaries = (await db_session.execute(stmt_sum)).scalars().all()
    assert len(summaries) == 1
    assert summaries[0].aggregate_consciousness == 5
    assert summaries[0].log_count == 1


@pytest.mark.asyncio
async def test_log_quick_entry_unauthorized(client):
    """POST /api/daily/log/quick without valid token returns 401."""
    payload = {"transport": "car", "consciousness_score": 2}
    with patch("app.api.daily.verify_firebase_token", _auth_mock_failing()):
        resp = await client.post(
            "/api/daily/log/quick", json=payload, headers=_AUTH_HEADERS
        )

    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_log_reflection_success(client, db_session):
    """POST /api/daily/log/reflection logs reflection correctly."""
    payload = {
        "message": "Thought about my energy footprint today.",
        "consciousness_score": 4,
    }
    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.post(
            "/api/daily/log/reflection", json=payload, headers=_AUTH_HEADERS
        )

    assert resp.status_code == 201
    data = resp.json()
    assert data["activity_type"] == "chat_reflection"
    assert data["consciousness_score"] == 4
    assert data["metadata"]["excerpt"] == "Thought about my energy footprint today."

    stmt = select(ActivityLog).where(ActivityLog.firebase_uid == "test_uid")
    logs = (await db_session.execute(stmt)).scalars().all()
    assert len(logs) == 1
    assert logs[0].activity_type == "chat_reflection"


@pytest.mark.asyncio
async def test_log_interview_success(client, db_session):
    """POST /api/daily/log/interview logs onboarding interview correctly."""
    payload = {
        "session_id": "test-session-uuid",
        "total_tonnes": 3.45,
        "mode": "detailed",
    }
    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.post(
            "/api/daily/log/interview", json=payload, headers=_AUTH_HEADERS
        )

    assert resp.status_code == 201
    assert resp.json() == {"status": "ok"}

    stmt = select(ActivityLog).where(ActivityLog.firebase_uid == "test_uid")
    logs = (await db_session.execute(stmt)).scalars().all()
    assert len(logs) == 1
    assert logs[0].activity_type == "interview"
    assert logs[0].consciousness_score == 5
    assert logs[0].activity_metadata["session_id"] == "test-session-uuid"


@pytest.mark.asyncio
async def test_get_streak_data_empty(client, db_session):
    """GET /api/daily/streak with no entries returns zeros and 365 contributions."""
    # Ensure user exists for streak endpoint
    db_session.add(User(firebase_uid="test_uid"))
    await db_session.commit()

    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.get("/api/daily/streak", headers=_AUTH_HEADERS)

    assert resp.status_code == 200
    data = resp.json()
    assert data["current_streak"] == 0
    assert data["longest_streak"] == 0
    assert data["total_days"] == 0
    assert len(data["entries"]) == 365


@pytest.mark.asyncio
async def test_get_streak_data_with_summaries(client, db_session):
    """GET /api/daily/streak correctly calculates streaks from DailySummary entries."""
    today = date.today()
    db_session.add(User(firebase_uid="test_uid"))
    await db_session.commit()

    # Insert 5 consecutive days of summaries ending today
    for i in range(5):
        summary_date = today - timedelta(days=4 - i)
        db_session.add(
            DailySummary(
                firebase_uid="test_uid",
                date=summary_date,
                aggregate_consciousness=4,
                log_count=1,
            )
        )
    await db_session.commit()

    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.get("/api/daily/streak", headers=_AUTH_HEADERS)

    assert resp.status_code == 200
    data = resp.json()
    assert data["current_streak"] == 5
    assert data["longest_streak"] == 5
    assert data["total_days"] == 5
    assert len(data["entries"]) == 365


@pytest.mark.asyncio
async def test_get_activity_logs_paginated_and_filtered(client, db_session):
    """GET /api/daily/logs returns paginated, filtered activity logs."""
    db_session.add(User(firebase_uid="test_uid"))
    await db_session.commit()

    # Insert a few logs
    now = datetime.now()
    yesterday = now - timedelta(days=1)

    log1 = ActivityLog(
        firebase_uid="test_uid",
        activity_type=ActivityType.QUICK_LOG,
        consciousness_score=4,
        activity_metadata={"transport": "ev"},
        logged_at=now,
    )
    log2 = ActivityLog(
        firebase_uid="test_uid",
        activity_type=ActivityType.CHAT_REFLECTION,
        consciousness_score=3,
        activity_metadata={"excerpt": "reflex"},
        logged_at=yesterday,
    )
    db_session.add_all([log1, log2])
    await db_session.commit()

    # Query all
    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.get("/api/daily/logs", headers=_AUTH_HEADERS)

    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["items"][0]["activity_type"] == "chat_reflection"
    assert data["items"][1]["activity_type"] == "quick_log"

    # Test date filtering
    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp_filtered = await client.get(
            f"/api/daily/logs?target_date={yesterday.date().isoformat()}",
            headers=_AUTH_HEADERS,
        )

    assert resp_filtered.status_code == 200
    data_filtered = resp_filtered.json()
    assert len(data_filtered["items"]) == 1
    assert data_filtered["items"][0]["activity_type"] == "chat_reflection"

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

    # Verify database state — single source of truth is activity_logs
    stmt = select(ActivityLog).where(ActivityLog.firebase_uid == "test_uid")
    logs = (await db_session.execute(stmt)).scalars().all()
    assert len(logs) == 1
    assert logs[0].consciousness_score == 5


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
async def test_get_streak_data_with_activities(client, db_session):
    """GET /api/daily/streak correctly calculates streaks from activity_logs."""
    today = date.today()
    db_session.add(User(firebase_uid="test_uid"))
    await db_session.commit()

    # Insert 5 consecutive days of activity, each with one event.
    for i in range(5):
        log_date = today - timedelta(days=4 - i)
        # Time component doesn't matter — the streak endpoint groups by DATE().
        db_session.add(
            ActivityLog(
                firebase_uid="test_uid",
                activity_type=ActivityType.QUICK_LOG,
                consciousness_score=4,
                activity_metadata={"transport": "bicycle"},
                logged_at=datetime.combine(log_date, datetime.min.time()),
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

    # Today's bucket should be intensity 1 (one event today).
    today_iso = today.isoformat()
    today_entry = next(e for e in data["entries"] if e["date"] == today_iso)
    assert today_entry["carbon_consciousness"] == 1


@pytest.mark.asyncio
async def test_streak_intensity_buckets_count_events(client, db_session):
    """Heatmap intensity must reflect the *number of events* on a day."""
    today = date.today()
    db_session.add(User(firebase_uid="test_uid"))
    await db_session.commit()

    # 5 events today → bucket 3 (4..6 events).
    for _ in range(5):
        db_session.add(
            ActivityLog(
                firebase_uid="test_uid",
                activity_type=ActivityType.QUICK_LOG,
                consciousness_score=3,
                activity_metadata={},
                logged_at=datetime.combine(today, datetime.min.time()),
            )
        )
    await db_session.commit()

    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.get("/api/daily/streak", headers=_AUTH_HEADERS)

    today_entry = next(e for e in resp.json()["entries"] if e["date"] == today.isoformat())
    assert today_entry["carbon_consciousness"] == 3


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


@pytest.mark.asyncio
async def test_get_daily_analysis_empty(client):
    """GET /api/daily/analysis with no logs returns default message."""
    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.get("/api/daily/analysis", headers=_AUTH_HEADERS)
    assert resp.status_code == 200
    assert "No carbon tracking activities recorded today" in resp.json()["analysis"]


@pytest.mark.asyncio
async def test_get_daily_analysis_with_logs(client, db_session):
    """GET /api/daily/analysis returns Gemini feedback or fallback."""
    db_session.add(User(firebase_uid="test_uid"))
    await db_session.commit()

    db_session.add(
        ActivityLog(
            firebase_uid="test_uid",
            activity_type=ActivityType.QUICK_LOG,
            consciousness_score=5,
            activity_metadata={"transport": "bicycle", "meal": "vegan"},
            logged_at=datetime.now(),
        )
    )
    await db_session.commit()

    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.get("/api/daily/analysis", headers=_AUTH_HEADERS)

    assert resp.status_code == 200
    assert "analysis" in resp.json()
    assert len(resp.json()["analysis"]) > 0


@pytest.mark.asyncio
async def test_create_daily_snapshot_success(client, db_session):
    """POST /api/snapshot/daily creates snapshot successfully and stores data."""
    db_session.add(User(firebase_uid="test_uid"))
    await db_session.commit()

    db_session.add(
        ActivityLog(
            firebase_uid="test_uid",
            activity_type=ActivityType.QUICK_LOG,
            consciousness_score=4,
            activity_metadata={"transport": "ev"},
            logged_at=datetime.now(),
        )
    )
    await db_session.commit()

    payload = {
        "display_name": "Test User",
        "analysis": "Test daily analysis summary sentence.",
        "contributions": [
            {"date": "2026-06-22", "carbon_consciousness": 2}
        ]
    }

    with patch("app.api.snapshot.verify_firebase_token", _auth_mock()):
        resp = await client.post("/api/snapshot/daily", json=payload, headers=_AUTH_HEADERS)

    assert resp.status_code == 200
    data = resp.json()
    assert "snapshot_id" in data

    get_resp = await client.get(f"/api/snapshot/{data['snapshot_id']}")
    assert get_resp.status_code == 200
    snap_payload = get_resp.json()
    assert snap_payload["type"] == "daily"
    assert snap_payload["display_name"] == "Test User"
    assert snap_payload["analysis"] == "Test daily analysis summary sentence."
    assert snap_payload["activities_count"] == 1
    assert snap_payload["average_score"] == 4.0
    assert snap_payload["contributions"][0]["carbon_consciousness"] == 2


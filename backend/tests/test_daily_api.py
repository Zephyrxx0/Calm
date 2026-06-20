"""Integration tests for the Daily Tracking API endpoints."""
from datetime import date, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.database import Base, get_session
from app.main import app
from app.models.daily_entry import DailyEntry


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
    from fastapi import HTTPException

    return AsyncMock(side_effect=HTTPException(status_code=401, detail="Invalid token"))


def _entry_payload(**overrides):
    """Minimal valid daily entry payload."""
    return {
        "transport_mode": "walking",
        "meals_count": 2,
        "energy_usage": "low",
        "carbon_consciousness": 4,
        **overrides,
    }


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


_AUTH_HEADERS = {"Authorization": "Bearer fake-test-token"}


@pytest.mark.asyncio
async def test_create_daily_entry_success(client):
    """POST /api/daily with valid auth and payload returns 201."""
    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.post(
            "/api/daily", json=_entry_payload(), headers=_AUTH_HEADERS
        )

    assert resp.status_code == 201
    data = resp.json()
    assert data["transport_mode"] == "walking"
    assert data["carbon_consciousness"] == 4
    assert data["date"] == str(date.today())
    assert "id" in data


@pytest.mark.asyncio
async def test_create_daily_entry_duplicate_date(client):
    """POST /api/daily twice for the same day returns 409 on second call."""
    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp1 = await client.post(
            "/api/daily", json=_entry_payload(), headers=_AUTH_HEADERS
        )
        assert resp1.status_code == 201

        resp2 = await client.post(
            "/api/daily", json=_entry_payload(), headers=_AUTH_HEADERS
        )
        assert resp2.status_code == 409
        assert "already exists" in resp2.json()["detail"]


@pytest.mark.asyncio
async def test_create_daily_entry_unauthorized(client):
    """POST /api/daily without valid token returns 401."""
    with patch("app.api.daily.verify_firebase_token", _auth_mock_failing()):
        resp = await client.post(
            "/api/daily", json=_entry_payload(), headers=_AUTH_HEADERS
        )

    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_streak_data_empty(client):
    """GET /api/daily/streak with no entries returns zeros."""
    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.get("/api/daily/streak", headers=_AUTH_HEADERS)

    assert resp.status_code == 200
    data = resp.json()
    assert data["current_streak"] == 0
    assert data["longest_streak"] == 0
    assert data["total_days"] == 0
    assert len(data["contributions"]) == 365


@pytest.mark.asyncio
async def test_get_streak_data_with_entries(client, db_session):
    """GET /api/daily/streak correctly calculates streaks from entries."""
    today = date.today()

    # Insert 5 consecutive days of entries ending today
    for i in range(5):
        entry_date = today - timedelta(days=4 - i)
        db_session.add(
            DailyEntry(
                firebase_uid="test_uid",
                date=entry_date,
                transport_mode="bicycle",
                carbon_consciousness=3,
            )
        )
    await db_session.commit()

    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.get("/api/daily/streak", headers=_AUTH_HEADERS)

    assert resp.status_code == 200
    data = resp.json()
    assert data["current_streak"] == 5  # 5 consecutive days ending today
    assert data["longest_streak"] == 5  # all 5 consecutive
    assert data["total_days"] == 5


@pytest.mark.asyncio
async def test_get_daily_entries(client, db_session):
    """GET /api/daily/entries returns user's entries in descending date order."""
    today = date.today()
    yesterday = today - timedelta(days=1)

    db_session.add_all(
        [
            DailyEntry(
                firebase_uid="test_uid",
                date=yesterday,
                transport_mode="car",
                carbon_consciousness=2,
            ),
            DailyEntry(
                firebase_uid="test_uid",
                date=today,
                transport_mode="bicycle",
                carbon_consciousness=5,
            ),
        ]
    )
    await db_session.commit()

    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.get("/api/daily/entries", headers=_AUTH_HEADERS)

    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 2
    # Descending order: today first
    assert data[0]["date"] == str(today)
    assert data[0]["carbon_consciousness"] == 5
    assert data[1]["date"] == str(yesterday)
    assert data[1]["carbon_consciousness"] == 2


@pytest.mark.asyncio
async def test_contribution_graph_data(client, db_session):
    """GET /api/daily/streak contributions has 365 items with date and intensity."""
    today = date.today()
    db_session.add(
        DailyEntry(
            firebase_uid="test_uid",
            date=today,
            transport_mode="walking",
            carbon_consciousness=4,
        )
    )
    await db_session.commit()

    with patch("app.api.daily.verify_firebase_token", _auth_mock()):
        resp = await client.get("/api/daily/streak", headers=_AUTH_HEADERS)

    assert resp.status_code == 200
    data = resp.json()
    contributions = data["contributions"]

    assert len(contributions) == 365
    # Check structure of each item
    for item in contributions:
        assert "date" in item
        assert "intensity" in item
        assert isinstance(item["intensity"], int)
        assert 0 <= item["intensity"] <= 4

    # Today's entry should have intensity > 0 (carbon_consciousness 4 → intensity 4)
    today_item = contributions[-1]
    assert today_item["date"] == str(today)
    assert today_item["intensity"] == 4

"""Tests for snapshot model and API."""
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch, MagicMock

from app.database import Base, get_session
from app.main import app
from app.models.session import Session as InterviewSession, Message
from app.models.snapshot import Snapshot


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture
async def client():
    """Create a test client with in-memory SQLite database."""
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    TestSessionLocal = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def _override_get_session():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_session] = _override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest.mark.asyncio
async def test_create_snapshot_returns_uuid(client):
    """POST /api/snapshot creates a snapshot and returns its UUID."""
    response = await client.post("/api/interview/start")
    session_id = response.json()["session_id"]

    mock_result = MagicMock()
    mock_result.total_co2e = 5200.0
    mock_result.breakdown = {"transport": 2000, "diet": 1500, "energy": 1700}

    with patch("app.api.snapshot.CarbonModel") as MockModel:
        MockModel.return_value.calculate.return_value = mock_result
        response = await client.post(f"/api/snapshot?session_id={session_id}")

    assert response.status_code == 200
    data = response.json()
    assert "snapshot_id" in data
    uuid.UUID(data["snapshot_id"])


@pytest.mark.asyncio
async def test_retrieve_snapshot_by_uuid(client):
    """GET /api/snapshot/{id} returns the stored payload."""
    response = await client.post("/api/interview/start")
    session_id = response.json()["session_id"]

    mock_result = MagicMock()
    mock_result.total_co2e = 3000.0
    mock_result.breakdown = {"transport": 1500, "diet": 1500}

    with patch("app.api.snapshot.CarbonModel") as MockModel:
        MockModel.return_value.calculate.return_value = mock_result
        create_resp = await client.post(f"/api/snapshot?session_id={session_id}")

    snapshot_id = create_resp.json()["snapshot_id"]

    get_resp = await client.get(f"/api/snapshot/{snapshot_id}")
    assert get_resp.status_code == 200
    payload = get_resp.json()
    assert payload["footprint"]["total_co2e"] == 3000.0
    assert "benchmarks" in payload


@pytest.mark.asyncio
async def test_snapshot_not_found(client):
    """GET /api/snapshot/{id} returns 404 for unknown UUID."""
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/snapshot/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_snapshot_invalid_session(client):
    """POST /api/snapshot returns 404 for non-existent session."""
    fake_id = str(uuid.uuid4())
    response = await client.post(f"/api/snapshot?session_id={fake_id}")
    assert response.status_code == 404

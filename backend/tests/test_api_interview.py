"""Tests for interview API endpoint (Task 2 - RED phase)."""
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.database import Base, get_session
from app.main import app


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture
async def client():
    """Create a test client with an in-memory SQLite database."""
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def _override_get_session():
        async with AsyncSession(test_engine) as session:
            yield session

    app.dependency_overrides[get_session] = _override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


class TestStartInterview:
    """Test 1: POST /api/interview/start creates a session and returns the UUID."""

    @pytest.mark.asyncio
    async def test_start_returns_session_id(self, client):
        """POST /api/interview/start returns a JSON response with a valid session UUID."""
        response = await client.post("/api/interview/start")
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        # Validate it's a valid UUID
        session_id = uuid.UUID(data["session_id"])
        assert session_id is not None

    @pytest.mark.asyncio
    async def test_start_creates_unique_sessions(self, client):
        """Each POST /api/interview/start creates a new unique session."""
        resp1 = await client.post("/api/interview/start")
        resp2 = await client.post("/api/interview/start")

        id1 = resp1.json()["session_id"]
        id2 = resp2.json()["session_id"]

        assert id1 != id2
        # Both valid UUIDs
        uuid.UUID(id1)
        uuid.UUID(id2)

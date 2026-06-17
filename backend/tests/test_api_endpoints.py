"""Tests for API endpoints — Chat SSE and Edition (Task 3 - RED phase)."""
import json
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from unittest.mock import AsyncMock, patch

from app.database import Base, get_session
from app.main import app
from app.models.session import Session as InterviewSession, Message


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


@pytest_asyncio.fixture
async def session_id(client):
    """Create a session and return its ID."""
    response = await client.post("/api/interview/start")
    return response.json()["session_id"]


class TestChatEndpoint:
    """Test 1: POST /message receives user text, updates DB, calls ai_coach, returns SSE."""

    @pytest.mark.asyncio
    async def test_post_message_returns_sse_stream(self, client, session_id):
        """POST /api/interview/{session_id}/message returns an SSE response."""
        mock_response = {
            "text": "Tell me about your commute.",
            "is_complete": False,
            "extracted_data": {},
        }
        with patch("app.api.interview.get_ai_coach") as mock_get_coach:
            mock_coach = AsyncMock()
            mock_coach.generate_response = AsyncMock(return_value=mock_response)
            mock_get_coach.return_value = mock_coach

            response = await client.post(
                f"/api/interview/{session_id}/message",
                json={"message": "I drive to work"},
            )
            assert response.status_code == 200
            assert "text/event-stream" in response.headers.get("content-type", "")

    @pytest.mark.asyncio
    async def test_post_message_stores_user_message(self, client, session_id):
        """POST /message saves the user message to the database."""
        mock_response = {
            "text": "Interesting.",
            "is_complete": False,
            "extracted_data": {},
        }
        with patch("app.api.interview.get_ai_coach") as mock_get_coach:
            mock_coach = AsyncMock()
            mock_coach.generate_response = AsyncMock(return_value=mock_response)
            mock_get_coach.return_value = mock_coach

            await client.post(
                f"/api/interview/{session_id}/message",
                json={"message": "I bike 5km to work"},
            )
            # Verify message was stored — check via edition endpoint
            edition_resp = await client.get(f"/api/edition/{session_id}")
            edition_data = edition_resp.json()
            messages = edition_data.get("messages", [])
            user_msgs = [m for m in messages if m["role"] == "user"]
            assert len(user_msgs) >= 1
            assert user_msgs[-1]["content"] == "I bike 5km to work"

    @pytest.mark.asyncio
    async def test_post_message_invalid_session_returns_404(self, client):
        """POST /message with non-existent session returns 404."""
        fake_id = str(uuid.uuid4())
        response = await client.post(
            f"/api/interview/{fake_id}/message",
            json={"message": "hello"},
        )
        assert response.status_code == 404


class TestEditionEndpoint:
    """Test 2: GET /edition/{session_id} returns footprint, categories, and quotes."""

    @pytest.mark.asyncio
    async def test_edition_returns_footprint_data(self, client, session_id):
        """GET /api/edition/{session_id} returns footprint and category breakdown."""
        # Add some messages to the session so there's data to compute
        with patch("app.api.interview.get_ai_coach") as mock_get_coach:
            mock_coach = AsyncMock()
            mock_coach.generate_response = AsyncMock(return_value={
                "text": "Got it.",
                "is_complete": False,
                "extracted_data": {"diet": {"type": "vegan"}},
            })
            mock_get_coach.return_value = mock_coach

            await client.post(
                f"/api/interview/{session_id}/message",
                json={"message": "I'm vegan"},
            )

        response = await client.get(f"/api/edition/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert "footprint" in data
        assert "total_co2e" in data["footprint"]
        assert "breakdown" in data["footprint"]

    @pytest.mark.asyncio
    async def test_edition_returns_messages(self, client, session_id):
        """GET /api/edition/{session_id} includes conversation messages."""
        response = await client.get(f"/api/edition/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data

    @pytest.mark.asyncio
    async def test_edition_invalid_session_returns_404(self, client):
        """GET /edition with non-existent session returns 404."""
        fake_id = str(uuid.uuid4())
        response = await client.get(f"/api/edition/{fake_id}")
        assert response.status_code == 404


class TestSSEProtocol:
    """Test 3: SSE stream output uses the Vercel AI SDK `0:"..."` protocol format."""

    @pytest.mark.asyncio
    async def test_sse_stream_uses_vercel_protocol(self, client, session_id):
        """SSE stream contains lines formatted as 0:"text" per Vercel AI SDK protocol."""
        mock_response = {
            "text": "Hello, tell me about your day.",
            "is_complete": False,
            "extracted_data": {},
        }
        with patch("app.api.interview.get_ai_coach") as mock_get_coach:
            mock_coach = AsyncMock()
            mock_coach.generate_response = AsyncMock(return_value=mock_response)
            mock_get_coach.return_value = mock_coach

            response = await client.post(
                f"/api/interview/{session_id}/message",
                json={"message": "hi"},
            )
            assert response.status_code == 200
            body = response.text
            # Vercel AI SDK Data Stream Protocol: text parts use 0:"..."
            assert '0:' in body, f"SSE body should contain Vercel protocol format, got: {body[:200]}"

    @pytest.mark.asyncio
    async def test_sse_stream_ends_with_done_marker(self, client, session_id):
        """SSE stream ends with a 'd' (done) marker per Vercel AI SDK protocol."""
        mock_response = {
            "text": "Response text.",
            "is_complete": False,
            "extracted_data": {},
        }
        with patch("app.api.interview.get_ai_coach") as mock_get_coach:
            mock_coach = AsyncMock()
            mock_coach.generate_response = AsyncMock(return_value=mock_response)
            mock_get_coach.return_value = mock_coach

            response = await client.post(
                f"/api/interview/{session_id}/message",
                json={"message": "test"},
            )
            body = response.text
            # Vercel AI SDK protocol ends with 'd' finish marker
            lines = [l for l in body.strip().split("\n") if l.strip()]
            assert any("d:" in line or line.strip() == "d" for line in lines), \
                f"SSE stream should end with done marker, got: {lines[-3:]}"

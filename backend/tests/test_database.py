"""Tests for database connection and models (Task 1 - RED phase)."""
import os
import uuid
from unittest.mock import patch

import pytest
import pytest_asyncio
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

# These imports will fail until implementation exists — that's the point of RED
from app.database import engine, get_session, Base
from app.models.session import Session as InterviewSession, Message


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture
async def db_session():
    """Create an in-memory SQLite async engine for testing."""
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSession(test_engine) as session:
        yield session
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


class TestDatabaseConnection:
    """Test 1: Database connects using DATABASE_URL."""

    def test_engine_is_configured(self):
        """engine object exists and is an async engine."""
        assert engine is not None
        assert hasattr(engine, "connect")

    def test_engine_uses_database_url(self):
        """Engine URL is derived from DATABASE_URL env var."""
        with patch.dict(os.environ, {"DATABASE_URL": "postgresql+asyncpg://testhost:5432/testdb"}):
            # Re-import to pick up patched env
            import importlib
            import app.database as db_mod
            importlib.reload(db_mod)
            url_str = str(db_mod.engine.url)
            assert "testhost" in url_str or "testdb" in url_str


class TestSessionModel:
    """Test 2: Session model with UUID id."""

    @pytest.mark.asyncio
    async def test_session_has_uuid_id(self, db_session):
        """Session primary key is a UUID."""
        session = InterviewSession()
        db_session.add(session)
        await db_session.flush()
        assert session.id is not None
        # Should be a valid UUID
        assert isinstance(session.id, uuid.UUID)

    @pytest.mark.asyncio
    async def test_session_can_be_queried(self, db_session):
        """Session can be inserted and retrieved via SQLAlchemy."""
        session = InterviewSession()
        db_session.add(session)
        await db_session.flush()

        result = await db_session.execute(
            select(InterviewSession).where(InterviewSession.id == session.id)
        )
        retrieved = result.scalar_one()
        assert retrieved.id == session.id


class TestMessageModel:
    """Test 3: Message model linked to Session with role and content."""

    @pytest.mark.asyncio
    async def test_message_has_role_and_content(self, db_session):
        """Message has role (user/ai) and content fields."""
        session = InterviewSession()
        db_session.add(session)
        await db_session.flush()

        msg = Message(session_id=session.id, role="user", content="Hello")
        db_session.add(msg)
        await db_session.flush()

        assert msg.role == "user"
        assert msg.content == "Hello"
        assert msg.session_id == session.id

    @pytest.mark.asyncio
    async def test_message_linked_to_session(self, db_session):
        """Message can be queried through its relationship to Session."""
        session = InterviewSession()
        db_session.add(session)
        await db_session.flush()

        msg1 = Message(session_id=session.id, role="user", content="What is your commute?")
        msg2 = Message(session_id=session.id, role="ai", content="Tell me about your daily commute.")
        db_session.add_all([msg1, msg2])
        await db_session.flush()

        result = await db_session.execute(
            select(Message).where(Message.session_id == session.id)
        )
        messages = result.scalars().all()
        assert len(messages) == 2
        roles = {m.role for m in messages}
        assert roles == {"user", "ai"}


class TestLedgerEntryModel:
    """Test LedgerEntry model linked to Session."""

    @pytest.mark.asyncio
    async def test_ledger_entry_creation(self, db_session):
        """LedgerEntry can be created linked to a Session."""
        from app.models.session import LedgerEntry

        session = InterviewSession()
        db_session.add(session)
        await db_session.flush()

        entry = LedgerEntry(
            session_id=session.id,
            description="Electricity bill",
            category="Energy",
            carbon_impact=45.2,
        )
        db_session.add(entry)
        await db_session.flush()

        assert entry.id is not None
        assert entry.session_id == session.id
        assert entry.carbon_impact == 45.2

    @pytest.mark.asyncio
    async def test_ledger_entry_query_by_session(self, db_session):
        """LedgerEntries can be queried by session_id."""
        from app.models.session import LedgerEntry

        session = InterviewSession()
        db_session.add(session)
        await db_session.flush()

        db_session.add_all([
            LedgerEntry(session_id=session.id, description="Gas", category="Energy", carbon_impact=30.0),
            LedgerEntry(session_id=session.id, description="Groceries", category="Food", carbon_impact=12.5),
        ])
        await db_session.flush()

        result = await db_session.execute(
            select(LedgerEntry).where(LedgerEntry.session_id == session.id)
        )
        entries = result.scalars().all()
        assert len(entries) == 2

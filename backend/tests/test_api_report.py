"""Tests for report API with insights and benchmarks."""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch, MagicMock, AsyncMock

from app.database import Base, get_session
from app.main import app


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
async def test_report_includes_benchmarks(client):
    """Report payload includes benchmark comparison data."""
    response = await client.post("/api/interview/start")
    session_id = response.json()["session_id"]

    mock_result = MagicMock()
    mock_result.total_co2e = 5000.0
    mock_result.breakdown = {"transport": 2500, "diet": 1500, "energy": 1000}

    mock_insights = {"summary": "Test summary", "recommendations": ["Rec 1"]}

    with patch("app.api.report.CarbonModel") as MockModel, \
         patch("app.api.report.InsightsService") as MockInsights:
        MockModel.return_value.calculate.return_value = mock_result
        MockInsights.return_value.get_insights = AsyncMock(return_value=mock_insights)
        response = await client.get(f"/api/report/{session_id}")

    assert response.status_code == 200
    data = response.json()
    assert "benchmarks" in data
    assert data["benchmarks"]["global"] == 4.7
    assert "label" in data["benchmarks"]


@pytest.mark.asyncio
async def test_report_includes_insights(client):
    """Report payload includes AI-generated insights."""
    response = await client.post("/api/interview/start")
    session_id = response.json()["session_id"]

    mock_result = MagicMock()
    mock_result.total_co2e = 8000.0
    mock_result.breakdown = {"transport": 4000, "diet": 2000, "energy": 2000}

    mock_insights = {
        "summary": "Your footprint is above average.",
        "recommendations": ["Take transit", "Eat plants", "Use renewables"],
    }

    with patch("app.api.report.CarbonModel") as MockModel, \
         patch("app.api.report.InsightsService") as MockInsights:
        MockModel.return_value.calculate.return_value = mock_result
        MockInsights.return_value.get_insights = AsyncMock(return_value=mock_insights)
        response = await client.get(f"/api/report/{session_id}")

    assert response.status_code == 200
    data = response.json()
    assert "insights" in data
    assert "summary" in data["insights"]
    assert len(data["insights"]["recommendations"]) == 3


@pytest.mark.asyncio
async def test_report_country_param(client):
    """Report respects country query param for benchmarks."""
    response = await client.post("/api/interview/start")
    session_id = response.json()["session_id"]

    mock_result = MagicMock()
    mock_result.total_co2e = 5000.0
    mock_result.breakdown = {"transport": 5000}

    mock_insights = {"summary": "Test", "recommendations": []}

    with patch("app.api.report.CarbonModel") as MockModel, \
         patch("app.api.report.InsightsService") as MockInsights:
        MockModel.return_value.calculate.return_value = mock_result
        MockInsights.return_value.get_insights = AsyncMock(return_value=mock_insights)
        response = await client.get(f"/api/report/{session_id}?country=US")

    data = response.json()
    assert data["benchmarks"]["national"] == 14.5
    assert data["benchmarks"]["label"] == "US Average"

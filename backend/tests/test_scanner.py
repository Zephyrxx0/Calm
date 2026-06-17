"""Tests for the Gemini scanner service."""
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture
def mock_genai_client():
    """Create a mock genai Client with async methods."""
    client = MagicMock()

    # Mock file upload
    uploaded_file = MagicMock()
    uploaded_file.name = "files/test-123"
    client.aio.files.upload = AsyncMock(return_value=uploaded_file)

    # Mock file get (for PDF polling)
    active_file = MagicMock()
    active_file.state.name = "ACTIVE"
    client.aio.files.get = AsyncMock(return_value=active_file)

    # Mock file delete
    client.aio.files.delete = AsyncMock()

    # Mock generate_content
    response = MagicMock()
    response.text = json.dumps({
        "description": "Monthly electricity",
        "category": "Energy",
        "carbon_impact": 42.5,
    })
    client.aio.models.generate_content = AsyncMock(return_value=response)

    return client


@pytest.mark.asyncio
async def test_scan_receipt_returns_extracted_data(mock_genai_client):
    """Scanner extracts description, category, and carbon_impact."""
    with patch("app.services.scanner.genai.Client", return_value=mock_genai_client):
        from app.services.scanner import scan_receipt_or_bill

        result = await scan_receipt_or_bill("/tmp/receipt.jpg", "image/jpeg")

    assert result == {
        "description": "Monthly electricity",
        "category": "Energy",
        "carbon_impact": 42.5,
    }
    mock_genai_client.aio.files.upload.assert_called_once_with(file="/tmp/receipt.jpg")
    mock_genai_client.aio.files.delete.assert_called_once_with(name="files/test-123")


@pytest.mark.asyncio
async def test_scan_deletes_file_on_error(mock_genai_client):
    """File is deleted even when generation fails."""
    mock_genai_client.aio.models.generate_content = AsyncMock(
        side_effect=RuntimeError("API error")
    )

    with patch("app.services.scanner.genai.Client", return_value=mock_genai_client):
        from app.services.scanner import scan_receipt_or_bill

        with pytest.raises(RuntimeError, match="API error"):
            await scan_receipt_or_bill("/tmp/receipt.jpg", "image/jpeg")

    mock_genai_client.aio.files.delete.assert_called_once_with(name="files/test-123")


@pytest.mark.asyncio
async def test_scan_pdf_polls_until_active(mock_genai_client):
    """PDF files are polled until state is ACTIVE."""
    pending_file = MagicMock()
    pending_file.state.name = "PROCESSING"
    active_file = MagicMock()
    active_file.state.name = "ACTIVE"
    mock_genai_client.aio.files.get = AsyncMock(side_effect=[pending_file, active_file])

    with patch("app.services.scanner.genai.Client", return_value=mock_genai_client):
        with patch("app.services.scanner.asyncio.sleep", new_callable=AsyncMock):
            from app.services.scanner import scan_receipt_or_bill

            result = await scan_receipt_or_bill("/tmp/bill.pdf", "application/pdf")

    assert result["category"] == "Energy"
    assert mock_genai_client.aio.files.get.call_count == 2

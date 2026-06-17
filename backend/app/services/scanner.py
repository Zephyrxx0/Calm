"""Gemini-powered receipt/bill scanner for carbon data extraction."""
import asyncio
import json

from google import genai

EXTRACTION_PROMPT = """Analyze this receipt or utility bill. Extract:
1. A brief description of the purchase/service
2. Category (one of: Energy, Transport, Food, Shopping)
3. Estimated carbon impact in kg CO2e

Respond ONLY with valid JSON: {"description": "...", "category": "...", "carbon_impact": <number>}"""


async def scan_receipt_or_bill(file_path: str, mime_type: str) -> dict:
    """Upload file to Gemini, extract carbon data, delete remote file.

    Args:
        file_path: Local path to the receipt/bill file.
        mime_type: MIME type (e.g. image/jpeg, application/pdf).

    Returns:
        dict with keys: description, category, carbon_impact
    """
    client = genai.Client()
    uploaded = await client.aio.files.upload(file=file_path)

    try:
        # PDFs need polling until state is ACTIVE
        if mime_type == "application/pdf":
            while True:
                file_info = await client.aio.files.get(name=uploaded.name)
                if file_info.state.name == "ACTIVE":
                    break
                await asyncio.sleep(1)

        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=[uploaded, EXTRACTION_PROMPT],
        )

        # Parse JSON from response text
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        data = json.loads(text)

        return {
            "description": str(data["description"]),
            "category": str(data["category"]),
            "carbon_impact": float(data["carbon_impact"]),
        }
    finally:
        await client.aio.files.delete(name=uploaded.name)

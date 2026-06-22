"""Insights engine — generates personalized summary text and recommendations.

Uses Gemini 1.5 Flash for conversational "flavor" text, with rule-based
fallback for consistent category-level recommendations (D-28, D-29).
"""
import os
from google import genai

INSIGHTS_PROMPT = """You are a calm, thoughtful environmental journalist writing a brief personal note to someone about their carbon footprint. Your tone is warm, encouraging, and never preachy.

Given this carbon breakdown (in kg CO2e/year):
{breakdown}

Total: {total:.1f} kg CO2e/year ({tons:.1f} tonnes)
Global average: 4.7 tonnes/year

Write:
1. A 2-3 sentence personal summary — acknowledge their footprint compassionately, note their highest category, and frame it constructively.
2. Three specific, actionable recommendations based on their highest-impact categories. Keep them achievable and calm.

Respond ONLY in this exact JSON format:
{{"summary": "...", "recommendations": ["...", "...", "..."]}}"""

# Fallback recommendations by category (D-29: generic category-level advice)
CATEGORY_ADVICE = {
    "transport": "Consider consolidating car trips or exploring public transit for your regular commute.",
    "travel": "One fewer long-haul flight per year can significantly reduce your air travel footprint.",
    "home": "Small adjustments to heating and insulation can meaningfully lower your home energy use.",
    "diet": "Shifting even a few meals per week toward plant-based options makes a measurable difference.",
    "shopping": "Buying fewer but longer-lasting items reduces both waste and manufacturing emissions.",
    "commute": "Walking or cycling for short trips adds up to meaningful carbon savings over a year.",
    "energy": "Switching to a renewable energy tariff is one of the easiest high-impact changes.",
}


class InsightsService:
    """Generates personalized carbon insights using Gemini + rule-based fallback."""

    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY", "")
        self.client = genai.Client(api_key=api_key) if api_key else None

    async def get_insights(self, breakdown: dict, total_co2e: float) -> dict:
        """Generate insights for a footprint breakdown.

        Returns:
            {"summary": str, "recommendations": [str, str, str]}
        """
        # Try Gemini first
        if self.client:
            try:
                return await self._gemini_insights(breakdown, total_co2e)
            except Exception:
                pass

        # Fallback: rule-based insights
        return self._rule_based_insights(breakdown, total_co2e)

    async def _gemini_insights(self, breakdown: dict, total_co2e: float) -> dict:
        """Use Gemini 1.5 Flash for personalized summary text."""
        import json

        breakdown_text = "\n".join(f"  {k}: {v:.0f} kg" for k, v in breakdown.items())
        prompt = INSIGHTS_PROMPT.format(
            breakdown=breakdown_text,
            total=total_co2e,
            tons=total_co2e / 1000,
        )

        response = await self.client.aio.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt,
        )

        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        return json.loads(text)

    def _rule_based_insights(self, breakdown: dict, total_co2e: float) -> dict:
        """Deterministic fallback when Gemini is unavailable."""
        tons = total_co2e / 1000
        sorted_cats = sorted(breakdown.items(), key=lambda x: x[1], reverse=True)
        top_cat = sorted_cats[0][0] if sorted_cats else "energy"

        if tons > 10:
            summary = (
                f"Your annual footprint of {tons:.1f} tonnes is above the global average. "
                f"Your {top_cat} habits are the largest contributor — "
                "small changes there could make a meaningful difference."
            )
        elif tons > 4.7:
            summary = (
                f"At {tons:.1f} tonnes per year, you're near the global average. "
                f"Your {top_cat} category stands out — "
                "there's room for gentle improvement."
            )
        else:
            summary = (
                f"At {tons:.1f} tonnes, you're below the global average — well done. "
                f"Even so, your {top_cat} category offers room to go further."
            )

        # Pick top 3 category recommendations
        recs = []
        for cat, _ in sorted_cats[:3]:
            advice = CATEGORY_ADVICE.get(cat, CATEGORY_ADVICE.get("energy", ""))
            if advice:
                recs.append(advice)

        return {"summary": summary, "recommendations": recs[:3]}

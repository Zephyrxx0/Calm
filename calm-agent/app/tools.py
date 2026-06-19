"""Tools for the Calm carbon coach agent.

Provides carbon footprint calculation, benchmark comparison, and
personalized insight generation.
"""

from app.config import (
    CARBON_BENCHMARKS,
    CATEGORIES,
    CATEGORY_ADVICE,
    COMMUTE_FACTORS,
    DIET_FACTORS,
    HOME_FACTORS,
    SHOPPING_FACTORS,
    TRAVEL_FACTORS,
)


def calculate_carbon(
    commute: dict | None = None,
    travel: dict | None = None,
    home: dict | None = None,
    diet_data: dict | None = None,
    shopping: dict | None = None,
) -> dict:
    """Calculate annual carbon footprint (kg CO2e) from structured interview data.

    Uses UK DEFRA 2023, ICAO, Poore & Nemecek 2018, and EU HH consumption-based
    coefficients. Call this when you have enough data to estimate the user's footprint.

    Args:
        commute: Dict with optional keys: distance_km (float), mode (str: car/bus/train/bike/walk)
        travel: Dict with optional keys: flights (int), type (str: short_haul/long_haul)
        home: Dict with optional keys: energy_type (str: gas/electric/renewable), household_size (int)
        diet_data: Dict with optional keys: type (str: meat/pescatarian/vegetarian/vegan)
        shopping: Dict with optional keys: level (str: minimal/average/heavy)

    Returns:
        Dict with total_co2e, total_tonnes, and breakdown by category in kg CO2e/year.
    """
    breakdown = dict.fromkeys(CATEGORIES, 0.0)

    if commute:
        distance = commute.get("distance_km", 0)
        mode = commute.get("mode", "car")
        factor = COMMUTE_FACTORS.get(mode, COMMUTE_FACTORS["car"])
        breakdown["commute"] = round(distance * factor, 2)

    if travel:
        flights = travel.get("flights", 0)
        flight_type = travel.get("type", "short_haul")
        factor = TRAVEL_FACTORS.get(flight_type, TRAVEL_FACTORS["short_haul"])
        breakdown["travel"] = round(flights * factor, 2)

    if home:
        energy_type = home.get("energy_type", "gas")
        household_size = home.get("household_size", 1)
        factor = HOME_FACTORS.get(energy_type, HOME_FACTORS["gas"])
        breakdown["home"] = round(factor / max(household_size, 1), 2)

    if diet_data:
        diet_type = diet_data.get("type", "meat")
        breakdown["diet"] = DIET_FACTORS.get(diet_type, DIET_FACTORS["meat"])

    if shopping:
        level = shopping.get("level", "average")
        breakdown["shopping"] = SHOPPING_FACTORS.get(level, SHOPPING_FACTORS["average"])

    total = round(sum(breakdown.values()), 2)
    return {
        "total_co2e": total,
        "total_tonnes": round(total / 1000, 2),
        "breakdown": breakdown,
    }


def get_benchmarks() -> dict:
    """Return global and national average carbon footprints (tonnes CO2e/year).

    Use this to compare the user's footprint against averages.

    Returns:
        Dict with global average and per-country benchmarks.
    """
    return {
        "benchmarks": CARBON_BENCHMARKS,
        "note": "All values in tonnes CO2e/year. Global average: 4.7 tonnes.",
    }


def generate_insights(total_tonnes: float, breakdown: dict) -> dict:
    """Generate personalized insights and recommendations from a carbon breakdown.

    Provides a brief summary and 3 actionable recommendations based on the
    highest-impact categories. Call this when presenting the final results.

    Args:
        total_tonnes: Total annual footprint in tonnes CO2e.
        breakdown: Dict mapping category names to kg CO2e/year values.

    Returns:
        Dict with summary (str) and recommendations (list of str).
    """
    sorted_cats = sorted(breakdown.items(), key=lambda x: x[1], reverse=True)
    top_cat = sorted_cats[0][0] if sorted_cats else "commute"

    if total_tonnes > 10:
        summary = (
            f"Your annual footprint of {total_tonnes:.1f} tonnes is above the "
            f"global average of 4.7 tonnes. Your {top_cat} habits are the largest "
            "contributor — small changes there could make a meaningful difference."
        )
    elif total_tonnes > 4.7:
        summary = (
            f"At {total_tonnes:.1f} tonnes per year, you're near the global average. "
            f"Your {top_cat} category stands out — there's room for gentle improvement."
        )
    else:
        summary = (
            f"At {total_tonnes:.1f} tonnes, you're below the global average — well done. "
            f"Even so, your {top_cat} category offers room to go further."
        )

    recs = []
    for cat, _ in sorted_cats[:3]:
        advice = CATEGORY_ADVICE.get(cat)
        if advice:
            recs.append(advice)

    return {"summary": summary, "recommendations": recs}

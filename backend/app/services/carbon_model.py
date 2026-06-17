"""Carbon footprint calculation model using hardcoded category-level coefficients.

Coefficient sources (D-11):
- Commute: UK DEFRA 2023 conversion factors (car: 0.21 kg CO2e/km, bus: 0.089 kg CO2e/km)
- Travel: ICAO carbon calculator averages (short-haul: 0.255 kg CO2e/passenger-km,
  long-haul: 0.195 kg CO2e/passenger-km), avg short-haul=800km, long-haul=4500km
- Home: UK BEIS 2023 gas=2.0 t/yr, electric=1.5 t/yr per household, divided by occupants
- Diet: Poore & Nemecek 2018 meta-analysis (meat: 3300 kg/yr, vegetarian: 1700,
  pescatarian: 1600, vegan: 1500)
- Shopping: EU HH consumption-based emissions (minimal: 500 kg/yr, average: 1200, heavy: 2400)
"""
from dataclasses import dataclass, field


@dataclass
class CarbonResult:
    """Result of a carbon footprint calculation."""
    total_co2e: float
    breakdown: dict[str, float] = field(default_factory=dict)


# --- Coefficient tables ---

# Commute: kg CO2e per km (DEFRA 2023)
COMMUTE_FACTORS = {
    "car": 0.21,
    "bus": 0.089,
    "train": 0.041,
    "bike": 0.0,
    "walk": 0.0,
}

# Travel: kg CO2e per flight (ICAO averages × typical distances)
# short_haul avg 800 km × 0.255 = 204 kg; long_haul avg 4500 km × 0.195 = 877.5 kg
TRAVEL_FACTORS = {
    "short_haul": 204.0,
    "long_haul": 877.5,
}

# Home: kg CO2e per year per household, divided by household_size
HOME_FACTORS = {
    "gas": 2000.0,
    "electric": 1500.0,
    "renewable": 200.0,
}

# Diet: kg CO2e per year (Poore & Nemecek 2018)
DIET_FACTORS = {
    "meat": 3300.0,
    "pescatarian": 1600.0,
    "vegetarian": 1700.0,
    "vegan": 1500.0,
}

# Shopping: kg CO2e per year (EU HH consumption-based)
SHOPPING_FACTORS = {
    "minimal": 500.0,
    "average": 1200.0,
    "heavy": 2400.0,
}

CATEGORIES = ("commute", "travel", "home", "diet", "shopping")


class CarbonModel:
    """Calculates carbon footprint from structured interview data."""

    def calculate(self, payload: dict) -> CarbonResult:
        """Calculate carbon footprint from structured payload.

        Args:
            payload: Dict with optional keys: commute, travel, home, diet, shopping.
                     Each key maps to a sub-dict with category-specific fields.

        Returns:
            CarbonResult with total_co2e and breakdown by category.
        """
        breakdown: dict[str, float] = {cat: 0.0 for cat in CATEGORIES}

        # Commute: distance_km × mode factor (daily × 250 working days)
        commute = payload.get("commute", {})
        if commute:
            distance = commute.get("distance_km", 0)
            mode = commute.get("mode", "car")
            factor = COMMUTE_FACTORS.get(mode, COMMUTE_FACTORS["car"])
            breakdown["commute"] = distance * factor * 250  # annualised

        # Travel: flights × per-flight factor
        travel = payload.get("travel", {})
        if travel:
            flights = travel.get("flights", 0)
            flight_type = travel.get("type", "short_haul")
            factor = TRAVEL_FACTORS.get(flight_type, TRAVEL_FACTORS["short_haul"])
            breakdown["travel"] = flights * factor

        # Home: annual household emissions / household_size
        home = payload.get("home", {})
        if home:
            energy_type = home.get("energy_type", "gas")
            household_size = home.get("household_size", 1)
            factor = HOME_FACTORS.get(energy_type, HOME_FACTORS["gas"])
            breakdown["home"] = factor / max(household_size, 1)

        # Diet: annual per-person emissions
        diet = payload.get("diet", {})
        if diet:
            diet_type = diet.get("type", "meat")
            breakdown["diet"] = DIET_FACTORS.get(diet_type, DIET_FACTORS["meat"])

        # Shopping: annual consumption emissions
        shopping = payload.get("shopping", {})
        if shopping:
            level = shopping.get("level", "average")
            breakdown["shopping"] = SHOPPING_FACTORS.get(level, SHOPPING_FACTORS["average"])

        total = sum(breakdown.values())
        return CarbonResult(total_co2e=round(total, 2), breakdown={k: round(v, 2) for k, v in breakdown.items()})

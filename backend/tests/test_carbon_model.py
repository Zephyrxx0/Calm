"""Tests for carbon calculation model (Task 1 - RED phase)."""
import pytest

from app.services.carbon_model import CarbonModel, CarbonResult


class TestCarbonModelCalculation:
    """Test 1: Calculates footprint for given JSON payload using hardcoded coefficients."""

    def test_calculate_returns_carbon_result(self):
        """calculate() returns a CarbonResult with total_co2e as a positive number."""
        model = CarbonModel()
        payload = {
            "commute": {"distance_km": 10, "mode": "car"},
            "travel": {"flights": 2, "type": "short_haul"},
            "home": {"energy_type": "gas", "household_size": 2},
            "diet": {"type": "meat"},
            "shopping": {"level": "average"},
        }
        result = model.calculate(payload)
        assert isinstance(result, CarbonResult)
        assert result.total_co2e > 0

    def test_calculate_with_minimal_payload(self):
        """calculate() handles a payload with only some categories filled."""
        model = CarbonModel()
        payload = {
            "diet": {"type": "vegan"},
        }
        result = model.calculate(payload)
        assert result.total_co2e > 0
        # Only diet category should have a value
        assert result.breakdown["diet"] > 0

    def test_calculate_with_empty_payload(self):
        """calculate() returns zero total for an empty payload."""
        model = CarbonModel()
        result = model.calculate({})
        assert result.total_co2e == 0

    def test_zero_commute_distance(self):
        """Zero commute distance contributes zero to commute category."""
        model = CarbonModel()
        payload = {"commute": {"distance_km": 0, "mode": "car"}}
        result = model.calculate(payload)
        assert result.breakdown["commute"] == 0


class TestCarbonModelBreakdown:
    """Test 2: Returns breakdown by 5 categories."""

    def test_breakdown_has_five_categories(self):
        """Result breakdown contains exactly 5 categories."""
        model = CarbonModel()
        payload = {
            "commute": {"distance_km": 10, "mode": "car"},
            "travel": {"flights": 4, "type": "long_haul"},
            "home": {"energy_type": "electric", "household_size": 1},
            "diet": {"type": "vegetarian"},
            "shopping": {"level": "heavy"},
        }
        result = model.calculate(payload)
        expected_categories = {"commute", "travel", "home", "diet", "shopping"}
        assert set(result.breakdown.keys()) == expected_categories

    def test_total_equals_sum_of_breakdown(self):
        """Total CO2e equals the sum of all category breakdowns."""
        model = CarbonModel()
        payload = {
            "commute": {"distance_km": 15, "mode": "bus"},
            "travel": {"flights": 1, "type": "short_haul"},
            "home": {"energy_type": "gas", "household_size": 3},
            "diet": {"type": "pescatarian"},
            "shopping": {"level": "minimal"},
        }
        result = model.calculate(payload)
        breakdown_sum = sum(result.breakdown.values())
        assert abs(result.total_co2e - breakdown_sum) < 0.01

    def test_breakdown_values_are_non_negative(self):
        """All breakdown category values are non-negative."""
        model = CarbonModel()
        payload = {
            "commute": {"distance_km": 5, "mode": "bike"},
            "diet": {"type": "vegan"},
        }
        result = model.calculate(payload)
        for category, value in result.breakdown.items():
            assert value >= 0, f"{category} breakdown is negative: {value}"

    def test_different_inputs_produce_different_totals(self):
        """Different payloads produce different total footprints."""
        model = CarbonModel()
        low_impact = {"diet": {"type": "vegan"}, "commute": {"distance_km": 0, "mode": "bike"}}
        high_impact = {
            "diet": {"type": "meat"},
            "commute": {"distance_km": 50, "mode": "car"},
            "travel": {"flights": 12, "type": "long_haul"},
        }
        low_result = model.calculate(low_impact)
        high_result = model.calculate(high_impact)
        assert high_result.total_co2e > low_result.total_co2e

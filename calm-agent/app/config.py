"""Configuration for the Calm carbon coach agent."""

from dataclasses import dataclass

CATEGORIES = ["commute", "travel", "home", "diet", "shopping"]

INTERVIEW_MODES = {
    "quick": 10,
    "detailed": 25,
}

MAX_INPUT_LENGTH = 2000

COMMUTE_FACTORS = {
    "car": 0.21,
    "bus": 0.089,
    "train": 0.041,
    "bike": 0.0,
    "walk": 0.0,
}

TRAVEL_FACTORS = {
    "short_haul": 204.0,
    "long_haul": 877.5,
}

HOME_FACTORS = {
    "gas": 2000.0,
    "electric": 1500.0,
    "renewable": 200.0,
}

DIET_FACTORS = {
    "meat": 3300.0,
    "pescatarian": 1600.0,
    "vegetarian": 1700.0,
    "vegan": 1500.0,
}

SHOPPING_FACTORS = {
    "minimal": 500.0,
    "average": 1200.0,
    "heavy": 2400.0,
}

CARBON_BENCHMARKS = {
    "global": 4.7,
    "US": 14.5,
    "UK": 4.25,
    "EU": 6.3,
    "India": 1.9,
}

CATEGORY_ADVICE = {
    "commute": "Walking or cycling for short trips adds up to meaningful carbon savings over a year.",
    "travel": "One fewer long-haul flight per year can significantly reduce your air travel footprint.",
    "home": "Switching to a renewable energy tariff is one of the easiest high-impact changes.",
    "diet": "Shifting even a few meals per week toward plant-based options makes a measurable difference.",
    "shopping": "Buying fewer but longer-lasting items reduces both waste and manufacturing emissions.",
}


@dataclass
class AgentConfig:
    model: str = "gemini-2.5-flash"
    default_mode: str = "quick"

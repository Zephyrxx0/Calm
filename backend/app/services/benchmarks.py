"""Benchmark service — national and global carbon footprint averages for comparison."""

CARBON_BENCHMARKS: dict[str, float] = {
    "global": 4.7,
    "US": 14.5,
    "UK": 4.25,
    "EU": 6.3,
    "India": 1.9,
}


class BenchmarkService:
    """Provides comparative carbon footprint data."""

    def get_benchmarks(self, country: str = "Global") -> dict:
        """Return global and national averages for comparison.

        Args:
            country: ISO-style country key (US, UK, EU, India) or "Global".

        Returns:
            {"global": float, "national": float, "label": str}
        """
        global_avg = CARBON_BENCHMARKS["global"]
        national_avg = CARBON_BENCHMARKS.get(country, global_avg)
        label = f"{country} Average" if country != "Global" else "Global Average"

        return {
            "global": global_avg,
            "national": national_avg,
            "label": label,
        }

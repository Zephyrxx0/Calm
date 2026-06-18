"""Tests for benchmark service."""
import pytest

from app.services.benchmarks import BenchmarkService


class TestBenchmarkService:
    def setup_method(self):
        self.svc = BenchmarkService()

    def test_get_benchmarks_global_default(self):
        result = self.svc.get_benchmarks()
        assert result["global"] == 4.7
        assert result["national"] == 4.7
        assert result["label"] == "Global Average"

    def test_get_benchmarks_us(self):
        result = self.svc.get_benchmarks("US")
        assert result["global"] == 4.7
        assert result["national"] == 14.5
        assert result["label"] == "US Average"

    def test_get_benchmarks_uk(self):
        result = self.svc.get_benchmarks("UK")
        assert result["national"] == 4.25

    def test_get_benchmarks_unknown_country_falls_back_to_global(self):
        result = self.svc.get_benchmarks("Unknown")
        assert result["national"] == 4.7

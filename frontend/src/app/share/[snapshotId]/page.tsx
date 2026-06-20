"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OrganicBarChart } from "@/components/charts/OrganicBar";
import NewspaperLayout from "@/components/broadsheet/NewspaperLayout";

interface SnapshotData {
  session_id: string;
  footprint: {
    total_co2e: number;
    breakdown: Record<string, number>;
  };
  messages: Array<{ role: string; content: string }>;
  benchmarks: {
    global: number;
    national: number;
    label: string;
  };
}

export default function SharePage({
  params,
}: {
  params: Promise<{ snapshotId: string }>;
}) {
  const [snapshotId, setSnapshotId] = useState<string>("");
  const [data, setData] = useState<SnapshotData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"standard" | "newspaper">("standard");

  useEffect(() => {
    params.then((p) => setSnapshotId(p.snapshotId));
  }, [params]);

  useEffect(() => {
    if (!snapshotId) return;

    async function fetchSnapshot() {
      try {
        const response = await fetch(`/api/snapshot/${snapshotId}`);
        if (!response.ok) throw new Error("Report not found");
        setData(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchSnapshot();
  }, [snapshotId]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center min-h-screen">
        <p className="text-sm text-muted">Loading shared report...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex flex-1 items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-sm text-destructive mb-4">
            {error || "Report not found"}
          </p>
          <Link
            href="/"
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            Create your own interview →
          </Link>
        </div>
      </main>
    );
  }

  const { footprint, benchmarks } = data;
  const totalTons = (footprint.total_co2e / 1000).toFixed(1);

  const chartData = Object.entries(footprint.breakdown).map(([name, co2e]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Number((co2e / 1000).toFixed(2)),
  }));

  const categoryBreakdown = Object.entries(footprint.breakdown).map(
    ([name, co2e]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: co2e,
    }),
  );

  return (
    <main className="flex flex-1 flex-col min-h-screen bg-background">
      {/* View toggle */}
      <div className="flex justify-center pt-6">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("standard")}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "standard"
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            Standard View
          </button>
          <button
            onClick={() => setViewMode("newspaper")}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === "newspaper"
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            View as Newspaper
          </button>
        </div>
      </div>

      {viewMode === "standard" && (
        <div className="p-8 md:p-12">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <header className="text-center mb-12">
              <p className="text-xs text-muted uppercase tracking-widest mb-2">
                Shared Report
              </p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">
                Carbon Summary
              </h1>
            </header>

            {/* Total */}
            <div className="text-center mb-12">
              <p className="text-sm text-muted uppercase tracking-wide mb-2">
                Total Annual Footprint
              </p>
              <p className="text-6xl font-semibold tracking-tight">
                {totalTons}
              </p>
              <p className="text-lg text-muted mt-2">tonnes CO₂e / year</p>
              <p className="text-xs text-muted mt-4">
                Global average: {benchmarks.global}t
              </p>
            </div>

            {/* Chart */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-6">
                Breakdown by Category
              </h2>
              <OrganicBarChart data={chartData} unit="t" />
            </section>

            {/* CTA */}
            <div className="text-center border-t border-border pt-8 mt-10">
              <p className="text-sm text-muted mb-4">
                Curious about your own footprint?
              </p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Create Your Own Interview
              </Link>
            </div>

            {/* Footer */}
            <footer className="text-center mt-8">
              <p className="text-xs text-muted-light">
                Generated by Calm
              </p>
            </footer>
          </div>
        </div>
      )}

      {viewMode === "newspaper" && (
        <div className="flex-1 overflow-auto bg-[#fafaf8]">
          <NewspaperLayout
            title="Carbon Summary"
            subtitle={`Shared report — ${totalTons} tonnes CO₂e/year`}
            footprint={footprint.total_co2e}
            categoryBreakdown={categoryBreakdown}
            streakData={null}
            pullQuotes={undefined}
          />
        </div>
      )}
    </main>
  );
}

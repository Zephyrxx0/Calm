"use client";

import { useEffect, useState, useRef } from "react";
import { toPng } from "html-to-image";
import Link from "next/link";
import { OrganicBarChart } from "@/components/charts/OrganicBar";

interface SummaryData {
  session_id: string;
  footprint: {
    total_co2e: number;
    breakdown: Record<string, number>;
  };
  messages: Array<{ role: string; content: string }>;
  quotes: string[];
  benchmarks: {
    global: number;
    national: number;
    label: string;
  };
  insights: {
    summary: string;
    recommendations: string[];
  };
}

export default function ReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const [sessionId, setSessionId] = useState<string>("");
  const [data, setData] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [benchmarkMode, setBenchmarkMode] = useState<"Global" | "National">("Global");
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    async function fetchSummary() {
      try {
        const response = await fetch(`/api/report/${sessionId}?country=US`);
        if (!response.ok) throw new Error("Failed to fetch summary data");
        const json = await response.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSummary();
    return () => { cancelled = true; };
  }, [sessionId]);

  const handleExportImage = async () => {
    if (!summaryRef.current || exporting) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(summaryRef.current, {
        quality: 0.95,
        backgroundColor: "#FAFAF8",
      });
      const link = document.createElement("a");
      link.download = `calm-report-${sessionId.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!summaryRef.current || exporting) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(summaryRef.current, {
        quality: 0.95,
        backgroundColor: "#FAFAF8",
        pixelRatio: 2,
      });
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });
      const ratio = img.height / img.width;
      const imgWidth = pageWidth - 20;
      const imgHeight = imgWidth * ratio;
      pdf.addImage(dataUrl, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`calm-report-${sessionId.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted">Preparing your report...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive mb-4">
            {error || "Report not found"}
          </p>
          <Link
            href="/"
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            Return home
          </Link>
        </div>
      </main>
    );
  }

  const { footprint, quotes, benchmarks, insights } = data;
  const totalTons = (footprint.total_co2e / 1000).toFixed(1);

  const chartData = Object.entries(footprint.breakdown).map(([name, co2e]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Number((co2e / 1000).toFixed(2)),
  }));

  const comparisonValue =
    benchmarkMode === "Global" ? benchmarks.global : benchmarks.national;

  return (
    <main className="flex flex-1 flex-col min-h-screen">
      {/* Action bar */}
      <div className="print:hidden border-b border-border px-6 py-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <Link
            href="/"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Back
          </Link>

          <div className="flex gap-2">
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Download PDF
            </button>
            <button
              onClick={handleExportImage}
              disabled={exporting}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Download Image"}
            </button>
          </div>
        </div>
      </div>

      {/* Report content */}
      <div ref={summaryRef} className="bg-background text-foreground p-8 md:p-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-3xl font-semibold tracking-tight mb-3">
              Your Carbon Report
            </h1>
            <p className="text-muted text-sm">
              Based on your lifestyle interview
            </p>
          </header>

          {/* Total footprint */}
          <div className="text-center mb-12">
            <p className="text-sm text-muted uppercase tracking-wide mb-2">
              Total Annual Footprint
            </p>
            <p className="text-6xl font-semibold tracking-tight">
              {totalTons}
            </p>
            <p className="text-lg text-muted mt-2">tonnes CO₂e / year</p>
          </div>

          {/* AI Insights */}
          {insights && (
            <section className="mb-10 border-y border-border py-8">
              <h2 className="text-lg font-semibold mb-4">The Journalist&apos;s Note</h2>
              <p className="text-base leading-relaxed text-foreground/80 mb-6">
                {insights.summary}
              </p>
              {insights.recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
                    Top Actions
                  </h3>
                  <ul className="space-y-2">
                    {insights.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm text-foreground/80"
                      >
                        <span className="text-accent font-medium shrink-0">
                          {i + 1}.
                        </span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Pull quotes */}
          {quotes.length > 0 && (
            <div className="py-6 mb-10">
              {quotes.map((quote, i) => (
                <blockquote
                  key={i}
                  className="text-lg italic text-center leading-relaxed px-4 text-muted"
                >
                  &ldquo;{quote}&rdquo;
                </blockquote>
              ))}
            </div>
          )}

          {/* Category breakdown chart */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-6">
              Breakdown by Category
            </h2>
            <OrganicBarChart data={chartData} unit="t" />
          </section>

          {/* Benchmark comparison */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">How You Compare</h2>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setBenchmarkMode("Global")}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    benchmarkMode === "Global"
                      ? "bg-accent text-white"
                      : "bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  Global
                </button>
                <button
                  onClick={() => setBenchmarkMode("National")}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    benchmarkMode === "National"
                      ? "bg-accent text-white"
                      : "bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  National
                </button>
              </div>
            </div>
            <div className="rounded-xl bg-surface p-6 shadow-sm">
              <div className="flex items-end gap-8 justify-center">
                <div className="text-center">
                  <p className="text-3xl font-semibold">{totalTons}t</p>
                  <p className="text-xs text-muted mt-1">You</p>
                </div>
                <div className="text-center opacity-60">
                  <p className="text-3xl font-semibold">{comparisonValue}t</p>
                  <p className="text-xs text-muted mt-1">
                    {benchmarkMode === "Global"
                      ? "Global Avg"
                      : benchmarks.label}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border pt-6 mt-10 text-center">
            <p className="text-xs text-muted-light">
              Generated by Calm —{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </footer>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: #fafaf8 !important;
            color: #2c2c2a !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `}</style>
    </main>
  );
}

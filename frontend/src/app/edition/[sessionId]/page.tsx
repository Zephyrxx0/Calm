"use client";

import { useEffect, useState, useRef } from "react";
import { toPng } from "html-to-image";
import Link from "next/link";

interface SummaryData {
  session_id: string;
  footprint: {
    total_co2e: number;
    breakdown: Record<string, number>;
  };
  messages: Array<{ role: string; content: string }>;
  quotes: string[];
}

export default function SummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const [sessionId, setSessionId] = useState<string>("");
  const [data, setData] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchSummary() {
      try {
        const response = await fetch(`/api/edition/${sessionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch summary data");
        }
        const summaryData = await response.json();
        setData(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
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
      link.download = `calm-summary-${sessionId.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted">Preparing your summary...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive mb-4">
            {error || "Summary not found"}
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

  const { footprint, quotes } = data;
  const totalTons = (footprint.total_co2e / 1000).toFixed(1);

  return (
    <main className="flex flex-1 flex-col min-h-screen">
      {/* Action bar (hidden in print) */}
      <div className="print:hidden border-b border-border px-6 py-3 flex justify-between items-center">
        <Link
          href="/"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          ← Back
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-border bg-surface px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Print / PDF
          </button>
          <button
            onClick={handleExportImage}
            disabled={exporting}
            className="rounded-lg border border-border bg-surface px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export Image"}
          </button>
        </div>
      </div>

      {/* Summary content */}
      <div ref={summaryRef} className="bg-background text-foreground p-8 md:p-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-3xl font-semibold tracking-tight mb-3">
              Your Carbon Summary
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
            <p className="text-xs text-muted-light mt-4">
              The global average is approximately 4.0 tonnes per person.
            </p>
          </div>

          {/* Pull quotes / insights */}
          {quotes.length > 0 && (
            <div className="border-y border-border py-6 mb-10">
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

          {/* Category breakdown */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-6">
              Breakdown by Category
            </h2>
            <div className="space-y-4">
              {Object.entries(footprint.breakdown).map(([category, co2e]) => {
                const percentage = (
                  (co2e / footprint.total_co2e) *
                  100
                ).toFixed(0);
                return (
                  <div key={category} className="rounded-xl bg-surface p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-sm capitalize">
                        {category}
                      </h3>
                      <p className="text-sm font-semibold">
                        {(co2e / 1000).toFixed(1)}t
                      </p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-light mt-1">
                      {percentage}% of total
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border pt-6 mt-10 text-center">
            <p className="text-xs text-muted-light">
              Generated by Calm — {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </footer>
        </div>
      </div>

      {/* Print styles */}
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

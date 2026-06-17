"use client";

import { useEffect, useState, useRef } from "react";
import { toPng } from "html-to-image";
import Link from "next/link";

interface EditionData {
  session_id: string;
  footprint: {
    total_co2e: number;
    breakdown: Record<string, number>;
  };
  messages: Array<{ role: string; content: string }>;
  quotes: string[];
}

export default function EditionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const [sessionId, setSessionId] = useState<string>("");
  const [data, setData] = useState<EditionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const editionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchEdition() {
      try {
        const response = await fetch(`/api/edition/${sessionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch edition data");
        }
        const editionData = await response.json();
        setData(editionData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchEdition();
  }, [sessionId]);

  const handleExportImage = async () => {
    if (!editionRef.current || exporting) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(editionRef.current, {
        quality: 0.95,
        backgroundColor: "#FDFCF7",
      });
      const link = document.createElement("a");
      link.download = `calm-edition-${sessionId.slice(0, 8)}.png`;
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
        <p className="font-mono text-sm tracking-wide uppercase text-muted-foreground">
          Typesetting your edition...
        </p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-destructive mb-4">
            {error || "Edition not found"}
          </p>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-wide underline"
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
    <main className="flex flex-1 flex-col">
      {/* Action bar (hidden in print) */}
      <div className="print:hidden border-b-2 border-ink px-6 py-3 flex justify-between items-center">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wide text-muted-foreground hover:text-ink"
        >
          ← Back
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-1 border border-ink font-mono text-xs uppercase tracking-wide hover:bg-ink hover:text-paper transition-colors"
          >
            Print / PDF
          </button>
          <button
            onClick={handleExportImage}
            disabled={exporting}
            className="px-4 py-1 border border-ink font-mono text-xs uppercase tracking-wide hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export Image"}
          </button>
        </div>
      </div>

      {/* Edition content */}
      <div ref={editionRef} className="bg-paper text-ink p-8 md:p-12">
        {/* Masthead */}
        <header className="text-center border-b-4 border-double border-ink pb-6 mb-8">
          <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground mb-2">
            A Personal Edition
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            The Calm Gazette
          </h1>
          <p className="font-mono text-xs tracking-wide mt-2 text-muted-foreground">
            Your Carbon Footprint, Typeset
          </p>
        </header>

        {/* Headline */}
        <h2 className="text-3xl md:text-5xl font-bold text-center leading-tight mb-4">
          YOUR FOOTPRINT: {totalTons} TONNES CO₂e PER YEAR
        </h2>

        <p className="text-center text-lg max-w-2xl mx-auto mb-8 text-muted-foreground">
          Based on your lifestyle interview, here is your personalized carbon
          profile — broken down by category, compared to the average, and
          paired with actionable steps.
        </p>

        {/* Pull quotes */}
        {quotes.length > 0 && (
          <div className="border-y-2 border-ink py-6 mb-8 max-w-2xl mx-auto">
            {quotes.map((quote, i) => (
              <blockquote
                key={i}
                className="text-xl md:text-2xl italic text-center leading-relaxed px-4"
              >
                &ldquo;{quote}&rdquo;
              </blockquote>
            ))}
          </div>
        )}

        {/* Category breakdown — multi-column broadsheet layout */}
        <section className="mb-8">
          <h3 className="text-2xl font-bold border-b-2 border-ink pb-2 mb-6">
            Breakdown by Category
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(footprint.breakdown).map(([category, co2e]) => {
              const percentage = (
                (co2e / footprint.total_co2e) *
                100
              ).toFixed(0);
              return (
                <div key={category} className="border border-ink p-4">
                  <h4 className="font-bold text-lg uppercase tracking-wide mb-2">
                    {category}
                  </h4>
                  <p className="text-3xl font-bold mb-1">
                    {(co2e / 1000).toFixed(1)}t
                  </p>
                  <div className="w-full bg-muted h-2 mb-1">
                    <div
                      className="bg-ink h-2"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {percentage}% of total
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footprint metric callout */}
        <section className="border-4 border-double border-ink p-8 text-center mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Total Annual Footprint
          </p>
          <p className="text-6xl md:text-7xl font-bold">
            {totalTons}
          </p>
          <p className="text-xl mt-2">tonnes CO₂e / year</p>
          <p className="font-mono text-xs text-muted-foreground mt-4">
            The global average is approximately 4.0 tonnes per person.
          </p>
        </section>

        {/* Footer */}
        <footer className="border-t-2 border-ink pt-4 mt-8 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            Generated by Calm — {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </footer>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            background: #fdfcf7 !important;
            color: #1a1a1a !important;
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

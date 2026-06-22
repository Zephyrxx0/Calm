"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import Link from "next/link";
import { OrganicBarChart } from "@/components/charts/OrganicBar";
import NewspaperLayout, {
  type NewspaperLayoutHandle,
  type StreakSummary,
} from "@/components/broadsheet/NewspaperLayout";
import { useAuth } from "@/contexts/AuthContext";

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

type ViewMode = "standard" | "broadsheet";

export default function SummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { user, loading: authLoading } = useAuth();
  const [sessionId, setSessionId] = useState<string>("");
  const [data, setData] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [benchmarkMode, setBenchmarkMode] = useState<"Global" | "National">("Global");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("standard");
  const [streakData, setStreakData] = useState<StreakSummary | null>(null);
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(null);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const broadsheetRef = useRef<NewspaperLayoutHandle>(null);

  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    async function fetchSummary() {
      try {
        const response = await fetch(`/api/edition/${sessionId}?country=US`);
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

  // Fetch streak data when user is authenticated
  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    async function fetchStreak() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch("/api/daily/streak", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setStreakData({
            currentStreak: json.current_streak ?? 0,
            longestStreak: json.longest_streak ?? 0,
            totalDays: json.total_days ?? 0,
          });
        }
      } catch {
        // Streak data is optional — fail silently
      }
    }

    fetchStreak();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // --------------- Export handlers ---------------

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
      pdf.save(`calm-summary-${sessionId.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleBroadsheetPNG = async () => {
    await broadsheetRef.current?.exportAsPNG();
  };

  const handleBroadsheetPDF = async () => {
    await broadsheetRef.current?.exportAsPDF();
  };

  // --------------- Share handlers ---------------

  const handleShareLink = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const response = await fetch(`/api/snapshot?session_id=${sessionId}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to create share link");
      const result = await response.json();
      const sid = result.snapshot_id;
      setSnapshotId(sid);
      const url = `${window.location.origin}/share/${sid}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setSharing(false);
    }
  };

  const handleShareSocialCard = async () => {
    if (sharing || !data) return;
    setSharing(true);
    try {
      // Create snapshot if not already created
      let sid = snapshotId;
      if (!sid) {
        const response = await fetch(`/api/snapshot?session_id=${sessionId}`, {
          method: "POST",
        });
        if (!response.ok) throw new Error("Failed to create snapshot");
        const result = await response.json();
        sid = result.snapshot_id;
        setSnapshotId(sid);
      }

      // Build OG image URL
      const footprintTons = (data.footprint.total_co2e / 1000).toFixed(1);
      const breakdown = Object.entries(data.footprint.breakdown)
        .sort(([, a], [, b]) => b - a);
      const topCategory = breakdown.length > 0 ? breakdown[0][0] : "";
      const streakDays =
        streakData?.currentStreak?.toString() ?? "0";

      const ogUrl = new URL(
        `/og`,
        window.location.origin,
      );
      ogUrl.searchParams.set("snapshotId", sid ?? "");
      ogUrl.searchParams.set("totalFootprint", footprintTons);
      ogUrl.searchParams.set("streakDays", streakDays);
      ogUrl.searchParams.set("topCategory", topCategory);

      setOgImageUrl(ogUrl.toString());
      await navigator.clipboard.writeText(ogUrl.toString());
    } catch (err) {
      console.error("Social card generation failed:", err);
    } finally {
      setSharing(false);
    }
  };

  // --------------- Loading / error states ---------------

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

  // --------------- Derived data ---------------

  const { footprint, quotes, benchmarks, insights } = data;
  const totalTons = (footprint.total_co2e / 1000).toFixed(1);

  // Chart data for standard view
  const chartData = Object.entries(footprint.breakdown).map(([name, co2e]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Number((co2e / 1000).toFixed(2)),
  }));

  // Category breakdown for broadsheet
  const categoryBreakdown = Object.entries(footprint.breakdown).map(
    ([name, co2e]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: co2e,
    }),
  );

  const comparisonValue =
    benchmarkMode === "Global" ? benchmarks.global : benchmarks.national;

  return (
    <main className="flex flex-1 flex-col min-h-screen">
      {/* Action bar */}
      <div className="print:hidden border-b border-border px-6 py-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          {/* Left: navigation + mode toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              ← Back
            </Link>
            {/* View mode toggle */}
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
                onClick={() => setViewMode("broadsheet")}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === "broadsheet"
                    ? "bg-accent text-white"
                    : "bg-surface text-muted hover:text-foreground"
                }`}
              >
                Broadsheet Preview
              </button>
            </div>
          </div>

          {/* Right: export / share controls */}
          <div className="flex gap-2 flex-wrap">
            {viewMode === "broadsheet" ? (
              <>
                <button
                  onClick={handleBroadsheetPNG}
                  disabled={exporting}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  Download Broadsheet (PNG)
                </button>
                <button
                  onClick={handleBroadsheetPDF}
                  disabled={exporting}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  Download Broadsheet (PDF)
                </button>
              </>
            ) : (
              <>
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
              </>
            )}

            {/* Social card share */}
            <button
              onClick={handleShareSocialCard}
              disabled={sharing}
              className="rounded-lg bg-accent/10 text-accent border border-accent/20 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent/20 disabled:opacity-50"
            >
              {ogImageUrl ? "✓ Social Card Copied" : sharing ? "Sharing..." : "Share Social Card"}
            </button>

            <button
              onClick={handleShareLink}
              disabled={sharing}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {shareUrl ? "✓ Link Copied" : sharing ? "Sharing..." : "Share Link"}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Broadsheet Preview ---------- */}
      {viewMode === "broadsheet" && (
        <div className="flex-1 overflow-auto bg-[#fafaf8]">
          <NewspaperLayout
            ref={broadsheetRef}
            title="Your Carbon Summary"
            subtitle="Based on your lifestyle interview"
            footprint={footprint.total_co2e}
            categoryBreakdown={categoryBreakdown}
            streakData={streakData}
            pullQuotes={quotes.map((q) => ({ text: q }))}
          />
        </div>
      )}

      {/* ---------- Standard view ---------- */}
      {viewMode === "standard" && (
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
      )}

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

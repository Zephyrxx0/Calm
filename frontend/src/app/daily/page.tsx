"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthButton } from "@/components/auth/AuthButton";
import { DailyForm } from "@/components/daily/DailyForm";
import { ContributionGraph } from "@/components/daily/ContributionGraph";
import { ActionDrawer } from "@/components/daily/ActionDrawer";
import { TimelineView } from "@/components/daily/TimelineView";
import NewspaperLayout from "@/components/broadsheet/NewspaperLayout";
import { DoodlePebbles } from "@/components/OrganicDoodles";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

type ViewMode = "tracking" | "newspaper";

export default function DailyPage() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [graphKey, setGraphKey] = useState(0);
  const [timelineKey, setTimelineKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("tracking");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<{
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
  } | null>(null);

  const handleEntryCreated = useCallback(() => {
    setGraphKey((k) => k + 1);
    setTimelineKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
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
        // Streak data optional — fail silently
      }
    }
    fetchStreak();
    return () => { cancelled = true; };
  }, [user]);

  // Auth guard: show loading while auth initializes
  if (authLoading || !mounted) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background relative overflow-hidden min-h-screen">
        <Grain />
        <Spinner className="h-8 w-8 text-accent" />
      </main>
    );
  }

  // Require authentication
  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-background relative overflow-hidden min-h-screen gap-6">
        <Grain />
        <DoodlePebbles className="absolute bottom-10 right-10 w-48 h-48 text-accent/5 pointer-events-none" />
        <h1 className="text-xl font-serif text-foreground">
          Daily Carbon Tracking
        </h1>
        <p className="text-sm font-sans text-muted max-w-xs text-center">
          Sign in to track your daily carbon impact and build your streak.
        </p>
        <AuthButton />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col min-h-screen bg-background relative overflow-hidden">
      <Grain />

      {/* Decorative Doodles */}
      <DoodlePebbles className="absolute top-1/3 -left-10 w-64 h-64 text-accent/5 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border/50 px-6 py-5 relative z-10 bg-background/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-lg font-serif text-foreground hover:text-accent transition-colors"
            >
              Calm
            </Link>
            <span className="text-[10px] font-medium text-muted uppercase tracking-[0.2em] hidden sm:inline">
              Daily Carbon Tracking
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/interview"
              className="text-xs font-sans text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3 inline mr-1" />
              Back to Interview
            </Link>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("tracking")}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === "tracking"
                    ? "bg-accent text-white"
                    : "bg-surface text-muted hover:text-foreground"
                }`}
              >
                Tracking
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
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      {viewMode === "tracking" && (
        <div className="flex-1 relative z-10">
          {/* Hero heatmap */}
          <div className="max-w-7xl mx-auto px-6 pt-10 pb-4">
            <ContributionGraph
              key={graphKey}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          <div className="max-w-2xl mx-auto px-6 pt-8 pb-4">
            <TimelineView
              key={`${timelineKey}-${selectedDate || "all"}`}
              filterDate={selectedDate}
              onClearFilter={() => setSelectedDate(null)}
            />
          </div>

          {/* Footer link */}
          <div className="mt-6 text-center pb-24">
            <Link
              href="/share"
              className="text-xs font-sans text-muted hover:text-accent transition-colors"
            >
              Generate Report →
            </Link>
          </div>

          {/* Floating action drawer */}
          <ActionDrawer onLogged={handleEntryCreated} />
        </div>
      )}

      {/* Newspaper view */}
      {viewMode === "newspaper" && (
        <div className="flex-1 overflow-auto bg-[#fafaf8]">
          <NewspaperLayout
            title="Your Daily Carbon Story"
            subtitle="A snapshot of your tracking progress"
            footprint={0}
            categoryBreakdown={[]}
            streakData={streakData}
            pullQuotes={undefined}
          />
        </div>
      )}
    </main>
  );
}

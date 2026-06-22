"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthButton } from "@/components/auth/AuthButton";
import { DailyForm } from "@/components/daily/DailyForm";
import { ContributionGraph } from "@/components/daily/ContributionGraph";
import { ActionDrawer } from "@/components/daily/ActionDrawer";
import { TimelineView } from "@/components/daily/TimelineView";
import { DoodlePebbles } from "@/components/OrganicDoodles";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";

function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

export default function DailyPage() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [graphKey, setGraphKey] = useState(0);
  const [timelineKey, setTimelineKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleEntryCreated = useCallback(() => {
    setGraphKey((k) => k + 1);
    setTimelineKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="flex h-screen h-[100dvh] bg-background relative overflow-hidden w-full">
      <Grain />

      {/* Persistent Sidebar on Desktop */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto relative">
        {/* Decorative Doodles */}
        <DoodlePebbles className="absolute top-1/3 -left-10 w-64 h-64 text-accent/5 pointer-events-none z-0" />

        {/* Mobile Header (Hidden on Desktop) */}
        <header className="flex-none border-b border-border/50 px-6 py-4 md:hidden relative z-50 bg-background/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-serif text-foreground hover:text-accent transition-colors"
            >
              Calm
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/interview"
                className="text-[10px] font-medium text-muted uppercase tracking-wider font-sans"
              >
                Interview
              </Link>
              <Link
                href="/daily"
                className="text-[10px] font-medium text-accent-hover uppercase tracking-wider font-sans border-b border-accent-hover"
              >
                Daily
              </Link>
              <AuthButton />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 relative z-10 w-full">
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
              key={timelineKey}
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
      </div>
    </div>
  );
}

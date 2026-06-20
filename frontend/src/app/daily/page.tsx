"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthButton } from "@/components/auth/AuthButton";
import { DailyForm } from "@/components/daily/DailyForm";
import { ContributionGraph } from "@/components/daily/ContributionGraph";
import { DoodlePebbles } from "@/components/OrganicDoodles";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

export default function DailyPage() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [graphKey, setGraphKey] = useState(0);

  const handleEntryCreated = useCallback(() => {
    setGraphKey((k) => k + 1);
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
    <main className="flex flex-1 flex-col min-h-screen bg-background relative overflow-hidden">
      <Grain />

      {/* Decorative Doodles */}
      <DoodlePebbles className="absolute top-1/3 -left-10 w-64 h-64 text-accent/5 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border/50 px-6 py-5 relative z-10 bg-background/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main Content — responsive layout */}
      <div className="flex-1 relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-8 lg:py-12">
          {/* Mobile: title visible here */}
          <h1 className="text-xl font-serif text-foreground mb-8 sm:hidden">
            Daily Carbon Tracking
          </h1>

          {/* Desktop: side-by-side. Mobile: stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12">
            {/* Left/Top: Daily Form */}
            <section>
              <div className="border border-border/50 bg-surface rounded-xl p-6 lg:p-8">
                <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-muted mb-6 font-sans">
                  Track Today
                </h2>
                <DailyForm onEntryCreated={handleEntryCreated} />
              </div>
            </section>

            {/* Right/Bottom: Contribution Graph */}
            <section>
              <div className="border border-border/50 bg-surface rounded-xl p-6 lg:p-8">
                <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-muted mb-6 font-sans">
                  Your Carbon Story
                </h2>
                <ContributionGraph key={graphKey} />
              </div>
            </section>
          </div>

          {/* Footer link */}
          <div className="mt-12 text-center">
            <Link
              href="/share"
              className="text-xs font-sans text-muted hover:text-accent transition-colors"
            >
              Generate Report →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

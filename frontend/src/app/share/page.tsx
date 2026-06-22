"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { SharePreview } from "@/components/share/SharePreview";
import { ShareActions } from "@/components/share/ShareActions";
import { Sidebar } from "@/components/Sidebar";
import { Spinner } from "@/components/ui/spinner";
import { DoodlePebbles } from "@/components/OrganicDoodles";
import { AuthButton } from "@/components/auth/AuthButton";
import Link from "next/link";

interface Contribution {
  date: string;
  carbon_consciousness: number;
}

interface ActivityLog {
  id: number;
  consciousness_score: number;
}

export default function ShareCreationPage() {
  const { user, loading: authLoading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for shared data
  const [analysis, setAnalysis] = useState<string>("");
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [streakData, setStreakData] = useState({
    current_streak: 0,
    longest_streak: 0,
    total_days: 0,
  });
  const [contributions, setContributions] = useState<Contribution[]>([]);

  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoadingData(false);
      return;
    }

    async function fetchDailyData() {
      try {
        const token = await user!.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Analysis, Streak, and Logs in parallel
        const [analysisRes, streakRes, logsRes] = await Promise.all([
          fetch("/api/daily/analysis", { headers }),
          fetch("/api/daily/streak", { headers }),
          fetch(`/api/daily/logs?target_date=${todayStr}`, { headers }),
        ]);

        if (!analysisRes.ok || !streakRes.ok || !logsRes.ok) {
          throw new Error("Failed to fetch daily tracking data.");
        }

        const analysisData = await analysisRes.json();
        const streakDataJson = await streakRes.json();
        const logsData = await logsRes.json();

        setAnalysis(analysisData.analysis);
        setStreakData({
          current_streak: streakDataJson.current_streak,
          longest_streak: streakDataJson.longest_streak,
          total_days: streakDataJson.total_days,
        });
        setContributions(streakDataJson.entries || []);

        const logsItems: ActivityLog[] = logsData.items || [];
        setActivitiesCount(logsItems.length);
        
        if (logsItems.length > 0) {
          const avg =
            logsItems.reduce((sum, item) => sum + item.consciousness_score, 0) /
            logsItems.length;
          setAverageScore(avg);
        } else {
          setAverageScore(0);
        }
      } catch (err) {
        console.error(err);
        setError("Could not load daily activity statistics.");
      } finally {
        setLoadingData(false);
      }
    }

    fetchDailyData();
  }, [user, authLoading, todayStr]);

  const handleCopyLink = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/snapshot/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          display_name: user.displayName || user.email?.split("@")[0] || "User",
          analysis: analysis,
          contributions: contributions,
        }),
      });
      if (!response.ok) throw new Error("Failed to create share snapshot");
      const data = await response.json();
      return `${window.location.origin}/share/${data.snapshot_id}`;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  if (authLoading || loadingData) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background relative overflow-hidden min-h-screen">
        <div className="grain" aria-hidden="true" />
        <Spinner className="h-8 w-8 text-accent" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-background relative overflow-hidden min-h-screen gap-6">
        <div className="grain" aria-hidden="true" />
        <DoodlePebbles className="absolute bottom-10 right-10 w-48 h-48 text-accent/5 pointer-events-none" />
        <h1 className="text-xl font-serif text-foreground">Share Achievements</h1>
        <p className="text-sm font-sans text-muted max-w-xs text-center">
          Sign in to view and share your carbon footprint summaries.
        </p>
        <AuthButton />
      </main>
    );
  }

  return (
    <div className="flex h-screen h-[100dvh] bg-background relative overflow-hidden w-full">
      <div className="grain" aria-hidden="true" />

      {/* Sidebar on desktop */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto relative p-6 sm:p-10 justify-center items-center">
        <DoodlePebbles className="absolute top-1/3 -left-10 w-64 h-64 text-accent/5 pointer-events-none z-0" />
        
        {/* Mobile header */}
        <header className="absolute top-0 left-0 right-0 border-b border-border/50 px-6 py-4 md:hidden z-50 bg-background/50 backdrop-blur-md flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-serif text-foreground hover:text-accent transition-colors"
          >
            Calm
          </Link>
          <AuthButton />
        </header>

        {error ? (
          <div className="text-center z-10">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Link
              href="/daily"
              className="text-xs text-accent hover:text-accent-hover underline font-sans"
            >
              Back to Daily Tracker
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full z-10 mt-12 md:mt-0 max-w-md animate-fade-up">
            <h1 className="text-xl font-serif text-foreground mb-6 text-center">
              Share Your Progress
            </h1>

            <SharePreview
              displayName={user.displayName || user.email?.split("@")[0] || "User"}
              analysis={analysis}
              activitiesCount={activitiesCount}
              averageScore={averageScore}
              streakData={streakData}
              contributions={contributions}
            />

            <ShareActions
              onCopyLink={handleCopyLink}
              dateStr={todayStr}
            />
          </div>
        )}
      </div>
    </div>
  );
}

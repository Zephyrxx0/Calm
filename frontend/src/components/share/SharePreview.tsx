"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { MonthlyView } from "@/components/daily/ContributionGraph";
import { DoodlePebbles } from "@/components/OrganicDoodles";
import { Check } from "lucide-react";

interface Contribution {
  date: string;
  carbon_consciousness: number;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_days: number;
}

interface SharePreviewProps {
  displayName: string;
  dateStr?: string;
  analysis: string;
  activitiesCount: number;
  averageScore: number;
  streakData: StreakData;
  contributions: Contribution[];
}

export function SharePreview({
  displayName,
  dateStr,
  analysis,
  activitiesCount,
  averageScore,
  streakData,
  contributions,
}: SharePreviewProps) {
  const targetDate = useMemo(() => {
    return dateStr ? parseISO(dateStr) : new Date();
  }, [dateStr]);

  const contributionMap = useMemo(() => {
    const map = new Map<string, number>();
    contributions.forEach((c) => {
      map.set(c.date, c.carbon_consciousness);
    });
    return map;
  }, [contributions]);

  const roundedScore = Math.round(averageScore);

  return (
    <div
      id="share-preview-card"
      className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm overflow-hidden"
      style={{ contentVisibility: "auto" }}
    >
      {/* Background organic doodles for aesthetics */}
      <DoodlePebbles className="absolute -top-10 -right-10 w-36 h-36 text-accent/5 pointer-events-none" />
      <DoodlePebbles className="absolute -bottom-10 -left-10 w-36 h-36 text-accent/5 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center mb-6">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted font-sans font-medium mb-1">
          {format(targetDate, "EEEE, MMMM d, yyyy")}
        </p>
        <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight">
          My Carbon Footprint Today
        </h2>
        <p className="text-xs text-muted-light mt-1 font-sans">
          Logged by <span className="text-foreground font-medium">{displayName}</span>
        </p>
      </div>

      {/* Key Stats Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-4 bg-background/30 rounded-xl p-4 border border-border/50 mb-6">
        <div className="text-center">
          <p className="text-[9px] tracking-[0.15em] uppercase text-muted font-sans mb-0.5">
            Activities Today
          </p>
          <p className="text-2xl font-serif text-foreground font-bold leading-none">
            {activitiesCount}
          </p>
          <p className="text-[9px] text-muted-light font-sans mt-1">
            {activitiesCount === 1 ? "activity logged" : "activities logged"}
          </p>
        </div>

        <div className="text-center border-l border-border/40">
          <p className="text-[9px] tracking-[0.15em] uppercase text-muted font-sans mb-0.5">
            Daily Consciousness
          </p>
          <div className="flex justify-center items-center gap-1.5 h-6">
            {roundedScore > 0 ? (
              <div className="flex gap-[3px]">
                {[1, 2, 3, 4, 5].map((pip) => (
                  <span
                    key={pip}
                    className="w-1.5 h-1.5 rounded-full transition-colors"
                    style={{
                      backgroundColor:
                        pip <= roundedScore
                          ? "var(--color-accent)"
                          : "var(--color-border)",
                    }}
                  />
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-light italic">No logs yet</span>
            )}
          </div>
          <p className="text-[9px] text-muted-light font-sans mt-0.5">
            {averageScore > 0 ? `${averageScore.toFixed(1)} / 5.0 score` : "No score today"}
          </p>
        </div>
      </div>

      {/* Analysis Quote */}
      <div className="relative z-10 border-t border-border/50 pt-5 mb-6 text-center">
        <p className="text-[9px] tracking-[0.18em] uppercase text-muted/80 font-sans mb-2.5">
          Coach Analysis
        </p>
        <blockquote className="px-4">
          <p className="text-xs sm:text-sm font-serif italic text-foreground leading-relaxed">
            &ldquo;{analysis}&rdquo;
          </p>
        </blockquote>
      </div>

      {/* Monthly Contribution Graph */}
      <div className="relative z-10 border-t border-border/50 pt-5 text-center">
        <p className="text-[9px] tracking-[0.18em] uppercase text-muted/80 font-sans mb-4">
          Monthly Contribution Graph
        </p>
        
        {/* Wrap in smaller container to scale down the MonthlyView if needed */}
        <div className="w-full max-w-[280px] mx-auto scale-90 origin-top">
          <MonthlyView
            viewMonth={targetDate}
            map={contributionMap}
          />
        </div>
        <p className="text-xs italic text-muted mt-0 font-serif">
          {format(targetDate, "MMMM")}
        </p>

        {/* Streak Stats (Small banner below graph) */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border/30 text-center">
          <div>
            <p className="text-sm font-serif font-bold text-foreground leading-none">
              {streakData.current_streak}
            </p>
            <p className="text-[8px] tracking-[0.12em] uppercase text-muted mt-1 font-sans">
              Current Streak
            </p>
          </div>
          <div className="w-px h-6 bg-border/40" />
          <div>
            <p className="text-sm font-serif font-bold text-foreground leading-none">
              {streakData.longest_streak}
            </p>
            <p className="text-[8px] tracking-[0.12em] uppercase text-muted mt-1 font-sans">
              Longest Streak
            </p>
          </div>
          <div className="w-px h-6 bg-border/40" />
          <div>
            <p className="text-sm font-serif font-bold text-foreground leading-none">
              {streakData.total_days}
            </p>
            <p className="text-[8px] tracking-[0.12em] uppercase text-muted mt-1 font-sans">
              Total Days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

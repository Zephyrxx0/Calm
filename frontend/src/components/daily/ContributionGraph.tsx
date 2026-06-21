"use client";

import { useEffect, useState, useCallback } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subMonths,
  addMonths,
  isSameMonth,
  isFuture,
} from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StreakEntry {
  date: string;
  carbon_consciousness: number;
}

interface StreakStats {
  current_streak: number;
  longest_streak: number;
  total_days: number;
  entries: StreakEntry[];
}

// 5 intensity levels from muted to accent
const INTENSITY_COLORS: Record<number, string> = {
  0: "#e8e6df",  // empty — very light warm grey
  1: "#e0cfc3",
  2: "#d4b49e",
  3: "#c99276",
  4: "#c2856b",  // full accent
};

const CONSCIOUSNESS_LABELS: Record<number, string> = {
  0: "No entry",
  1: "Not conscious",
  2: "Slightly conscious",
  3: "Moderately conscious",
  4: "Very conscious",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function DayCell({
  date,
  intensity,
  isFutureDate,
}: {
  date: Date;
  intensity: number;
  isFutureDate: boolean;
}) {
  const label = CONSCIOUSNESS_LABELS[Math.min(intensity, 4)] ?? "No entry";
  const title = `${format(date, "MMM d, yyyy")} — ${intensity > 0 ? label : "No entry"}`;

  return (
    <div
      title={title}
      className="w-full aspect-square rounded-[3px] transition-all duration-150 cursor-default"
      style={{
        backgroundColor: isFutureDate
          ? "transparent"
          : INTENSITY_COLORS[Math.min(intensity, 4)],
        opacity: isFutureDate ? 0.2 : 1,
        outline: "1px solid rgba(26,26,26,0.07)",
        outlineOffset: "-1px",
      }}
    />
  );
}

export function ContributionGraph() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState(new Date());

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function fetchStreak() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch("/api/daily/streak", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const json: StreakStats = await res.json();
        if (!cancelled) setData(json);
      } catch {
        /* fail silently */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStreak();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const valueMap = useCallback(() => {
    if (!data?.entries) return new Map<string, number>();
    return new Map(data.entries.map((e) => [e.date, e.carbon_consciousness]));
  }, [data]);

  const goToPrev = () => setViewMonth((m) => subMonths(m, 1));
  const goToNext = () => {
    const next = addMonths(viewMonth, 1);
    if (!isFuture(startOfMonth(next)) || isSameMonth(next, new Date())) {
      setViewMonth(next);
    }
  };

  const isNextDisabled = isSameMonth(viewMonth, new Date());

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-6 w-6 text-accent" />
      </div>
    );
  }

  // Build the monthly grid
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Leading empty cells so the first day lands on the right weekday column
  const startWeekday = getDay(monthStart); // 0 = Sunday
  const emptyCells = Array.from({ length: startWeekday });

  const map = valueMap();

  return (
    <div className="w-full font-sans">
      {/* Month header + navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrev}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-muted hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-serif text-foreground tracking-wide">
          {format(viewMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={goToNext}
          disabled={isNextDisabled}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Heatmap + vertical legend side-by-side */}
      <div className="flex gap-4 items-start">
        {/* Calendar grid */}
        <div className="flex-1">
          {/* Day-of-week labels */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-[9px] tracking-widest uppercase text-muted/60 pb-0.5"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {emptyCells.map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const intensity = map.get(dateStr) ?? 0;
              return (
                <DayCell
                  key={dateStr}
                  date={day}
                  intensity={intensity}
                  isFutureDate={isFuture(day)}
                />
              );
            })}
          </div>
        </div>

        {/* Vertical legend */}
        <div className="flex flex-col items-center gap-1.5 pt-5 shrink-0">
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted/60 mb-0.5 -rotate-90 origin-center whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", letterSpacing: "0.15em" }}>
            Less
          </span>
          {[4, 3, 2, 1, 0].map((level) => (
            <div
              key={level}
              title={CONSCIOUSNESS_LABELS[level]}
              className="w-4 h-4 rounded-[3px]"
              style={{
                backgroundColor: INTENSITY_COLORS[level],
                outline: "1px solid rgba(26,26,26,0.09)",
                outlineOffset: "-1px",
              }}
            />
          ))}
          <span className="text-[9px] tracking-[0.15em] uppercase text-muted/60 mt-0.5" style={{ writingMode: "vertical-rl", letterSpacing: "0.15em" }}>
            More
          </span>
        </div>
      </div>

      {/* Streak stats below heatmap */}
      {data && (
        <div className="flex items-center justify-center gap-10 mt-8 pt-6 border-t border-border/40">
          <div className="text-center">
            <p className="text-3xl font-serif text-foreground leading-none">
              {data.current_streak}
            </p>
            <p className="text-[9px] tracking-[0.18em] uppercase text-muted mt-1.5">
              Current Streak
            </p>
          </div>
          <div className="w-px h-10 bg-border" aria-hidden="true" />
          <div className="text-center">
            <p className="text-3xl font-serif text-foreground leading-none">
              {data.longest_streak}
            </p>
            <p className="text-[9px] tracking-[0.18em] uppercase text-muted mt-1.5">
              Longest Streak
            </p>
          </div>
          <div className="w-px h-10 bg-border" aria-hidden="true" />
          <div className="text-center">
            <p className="text-3xl font-serif text-foreground leading-none">
              {data.total_days}
            </p>
            <p className="text-[9px] tracking-[0.18em] uppercase text-muted mt-1.5">
              Total Days
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

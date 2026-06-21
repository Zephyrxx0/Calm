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
  startOfYear,
  subYears,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  getMonth,
} from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

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

type ViewMode = "month" | "year";

// ─── Constants ───────────────────────────────────────────────────────────────

const INTENSITY_COLORS: Record<number, string> = {
  0: "#e8e6df",
  1: "#e0cfc3",
  2: "#d4b49e",
  3: "#c99276",
  4: "#c2856b",
};

const CONSCIOUSNESS_LABELS: Record<number, string> = {
  0: "No entry",
  1: "Not conscious",
  2: "Slightly conscious",
  3: "Moderately conscious",
  4: "Very conscious",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Shared cell component ───────────────────────────────────────────────────

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
  const sizeClass = "w-5 h-5 rounded-[3px]";

  return (
    <div
      title={title}
      className={`${sizeClass} transition-all duration-150 cursor-default hover:ring-1 hover:ring-accent/50`}
      style={{
        backgroundColor: isFutureDate ? "#e8e6df" : INTENSITY_COLORS[Math.min(intensity, 4)],
        opacity: isFutureDate ? 0.3 : 1,
        outline: isFutureDate ? "1px solid rgba(26,26,26,0.03)" : "1px solid rgba(26,26,26,0.07)",
        outlineOffset: "-1px",
      }}
    />
  );
}

// ─── Vertical legend ─────────────────────────────────────────────────────────

function VerticalLegend() {
  return (
    <div className="flex flex-col items-center gap-1.5 pt-5 shrink-0">
      <span
        className="text-[9px] tracking-[0.15em] uppercase text-muted/60 mb-0.5"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
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
      <span
        className="text-[9px] tracking-[0.15em] uppercase text-muted/60 mt-0.5"
        style={{ writingMode: "vertical-rl" }}
      >
        More
      </span>
    </div>
  );
}

// ─── Monthly view ────────────────────────────────────────────────────────────

function MonthlyView({
  viewMonth,
  map,
  onPrev,
  onNext,
  isNextDisabled,
}: {
  viewMonth: Date;
  map: Map<string, number>;
  onPrev: () => void;
  onNext: () => void;
  isNextDisabled: boolean;
}) {
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = getDay(monthStart);
  const emptyCells = Array.from({ length: startWeekday });

  return (
    <div className="flex-1 w-full">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6 max-w-xs mx-auto">
        <button
          onClick={onPrev}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-muted hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-serif text-foreground tracking-wide whitespace-nowrap px-4">
          {format(viewMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={onNext}
          disabled={isNextDisabled}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="flex justify-center">
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[10px] tracking-widest uppercase text-muted/60 pb-1">
              {d.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      {/* Day cells */}
      <div className="flex justify-center">
        <div className="grid grid-cols-7 gap-[3px]">
          {emptyCells.map((_, i) => <div key={`e-${i}`} />)}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            return (
              <div key={dateStr}>
                <DayCell
                  date={day}
                  intensity={map.get(dateStr) ?? 0}
                  isFutureDate={isFuture(day)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Yearly view ─────────────────────────────────────────────────────────────

function YearlyView({
  viewYear,
  map,
  onPrev,
  onNext,
  isNextDisabled,
}: {
  viewYear: Date;
  map: Map<string, number>;
  onPrev: () => void;
  onNext: () => void;
  isNextDisabled: boolean;
}) {
  const yearStart = startOfYear(viewYear);

  // Build week columns: each column is one week (Sun–Sat)
  const weeks = eachWeekOfInterval(
    { start: yearStart, end: new Date(viewYear.getFullYear(), 11, 31) },
    { weekStartsOn: 0 }
  );

  // Month label positions: track which column each month first appears in
  const monthPositions: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((weekStart, colIdx) => {
    const m = getMonth(weekStart);
    if (m !== lastMonth) {
      if (weekStart.getFullYear() === viewYear.getFullYear()) {
        monthPositions.push({ label: MONTH_LABELS[m], col: colIdx });
      }
      lastMonth = m;
    }
  });

  return (
    <div className="flex-1 min-w-0">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="p-2 rounded-lg hover:bg-border/50 transition-colors text-muted hover:text-foreground" aria-label="Previous year">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-serif text-foreground tracking-wide">
          {format(viewYear, "yyyy")}
        </h2>
        <button onClick={onNext} disabled={isNextDisabled} className="p-2 rounded-lg hover:bg-border/50 transition-colors text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Next year">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Month labels row */}
      <div className="relative h-4 mb-1 overflow-hidden">
        {monthPositions.map(({ label, col }) => {
          const isCurrentMonth = 
            label === MONTH_LABELS[new Date().getMonth()] &&
            viewYear.getFullYear() === new Date().getFullYear();
          
          return (
            <span
              key={`${label}-${col}`}
              className={`absolute text-[9px] tracking-wider uppercase ${
                isCurrentMonth ? "text-foreground font-bold" : "text-muted/70"
              }`}
              style={{ left: `${(col / weeks.length) * 100}%` }}
            >
              {label}
            </span>
          );
        })}
      </div>

      {/* Grid: 7 rows (days) × N columns (weeks) */}
      <div className="flex justify-center pb-2 w-full">
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
            gridTemplateRows: "repeat(7, auto)",
            gridAutoFlow: "column",
          }}
        >
          {weeks.map((weekStart) => {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
            const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
            return days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              return (
                <div key={dateStr}>
                  <DayCell
                    date={day}
                    intensity={map.get(dateStr) ?? 0}
                    isFutureDate={isFuture(day)}
                  />
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Stats bar ───────────────────────────────────────────────────────────────

function StatsBar({ data }: { data: StreakStats }) {
  return (
    <div className="flex items-center justify-center gap-10 mt-8 pt-6 border-t border-border/40">
      <div className="text-center">
        <p className="text-3xl font-serif text-foreground leading-none">{data.current_streak}</p>
        <p className="text-[9px] tracking-[0.18em] uppercase text-muted mt-1.5">Current Streak</p>
      </div>
      <div className="w-px h-10 bg-border" aria-hidden="true" />
      <div className="text-center">
        <p className="text-3xl font-serif text-foreground leading-none">{data.longest_streak}</p>
        <p className="text-[9px] tracking-[0.18em] uppercase text-muted mt-1.5">Longest Streak</p>
      </div>
      <div className="w-px h-10 bg-border" aria-hidden="true" />
      <div className="text-center">
        <p className="text-3xl font-serif text-foreground leading-none">{data.total_days}</p>
        <p className="text-[9px] tracking-[0.18em] uppercase text-muted mt-1.5">Total Days</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ContributionGraph() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [viewMonth, setViewMonth] = useState(new Date());
  const [viewYear, setViewYear] = useState(new Date());

  useEffect(() => {
    if (authLoading || !user) { setLoading(false); return; }
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
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    }
    fetchStreak();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const valueMap = useCallback((): Map<string, number> => {
    if (!data?.entries) return new Map();
    return new Map(data.entries.map((e) => [e.date, e.carbon_consciousness]));
  }, [data]);

  // Month nav
  const goMonthPrev = () => setViewMonth((m) => subMonths(m, 1));
  const goMonthNext = () => {
    const next = addMonths(viewMonth, 1);
    if (!isFuture(startOfMonth(next)) || isSameMonth(next, new Date())) setViewMonth(next);
  };
  const isMonthNextDisabled = isSameMonth(viewMonth, new Date());

  // Year nav
  const goYearPrev = () => setViewYear((y) => subYears(y, 1));
  const goYearNext = () => {
    const next = new Date(viewYear.getFullYear() + 1, 0, 1);
    if (next.getFullYear() <= new Date().getFullYear()) setViewYear(next);
  };
  const isYearNextDisabled = viewYear.getFullYear() >= new Date().getFullYear();

  if (authLoading || loading) {
    return <div className="flex items-center justify-center py-24"><Spinner className="h-6 w-6 text-accent" /></div>;
  }

  const map = valueMap();

  return (
    <div className="w-full font-sans">
      {/* View toggle */}
      <div className="flex justify-end mb-5">
        <div className="flex rounded-lg border border-border overflow-hidden text-xs">
          {(["month", "year"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 capitalize font-medium transition-colors ${
                viewMode === mode
                  ? "bg-foreground text-background"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap + vertical legend */}
      <div className="flex gap-4 items-start justify-center">
        {viewMode === "month" ? (
          <MonthlyView
            viewMonth={viewMonth}
            map={map}
            onPrev={goMonthPrev}
            onNext={goMonthNext}
            isNextDisabled={isMonthNextDisabled}
          />
        ) : (
          <YearlyView
            viewYear={viewYear}
            map={map}
            onPrev={goYearPrev}
            onNext={goYearNext}
            isNextDisabled={isYearNextDisabled}
          />
        )}
        <VerticalLegend />
      </div>

      {/* Stats */}
      {data && <StatsBar data={data} />}
    </div>
  );
}

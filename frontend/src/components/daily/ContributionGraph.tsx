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
  0: "#EDEAE1",  // no entry — near page background
  1: "#D9CBBA",  // very light warm
  2: "#C4A07A",  // light terracotta
  3: "#A66F3A",  // medium terracotta
  4: "#7A4920",  // deep rich terracotta
};

// Heatmap intensity reflects the *number of activities* that day (the same
// activities that drive the timeline). Buckets must match the backend
// `_count_to_intensity` mapping in `app/api/daily.py`.
const ACTIVITY_LABELS: Record<number, string> = {
  0: "No activity",
  1: "1 activity",
  2: "2 activities",
  3: "3–4 activities",
  4: "5+ activities",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Shared cell component ───────────────────────────────────────────────────

function DayCell({
  date,
  intensity,
  isFutureDate,
  size = "md",
  isSelected = false,
  onClick,
}: {
  date: Date;
  intensity: number;
  isFutureDate: boolean;
  size?: "sm" | "md" | "lg";
  isSelected?: boolean;
  onClick?: (dateStr: string) => void;
}) {
  const label = ACTIVITY_LABELS[Math.min(intensity, 4)] ?? "No activity";
  const title = `${format(date, "MMM d, yyyy")} — ${intensity > 0 ? label : "No activity"}`;
  const clickable = intensity > 0 && !isFutureDate && !!onClick;

  let sizeClass = "w-full aspect-square rounded-[3px]";
  if (size === "sm") sizeClass = "w-5 h-5 rounded-[3px]";
  if (size === "lg") sizeClass = "w-10 h-10 sm:w-11 sm:h-11 rounded-[4px]";

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      title={title}
      onClick={clickable ? () => onClick(format(date, "yyyy-MM-dd")) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick(format(date, "yyyy-MM-dd"));
            }
          : undefined
      }
      className={`${sizeClass} transition-all duration-150 ${
        clickable ? "cursor-pointer" : "cursor-default"
      } hover:ring-1 hover:ring-accent/50`}
      style={{
        backgroundColor: isFutureDate ? "#EDEAE1" : INTENSITY_COLORS[Math.min(intensity, 4)],
        opacity: isFutureDate ? 0.3 : 1,
        outline: isSelected
          ? "2px solid var(--color-foreground)"
          : isFutureDate
          ? "1px solid rgba(26,26,26,0.03)"
          : "1px solid rgba(26,26,26,0.09)",
        outlineOffset: isSelected ? "1px" : "-1px",
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
          title={ACTIVITY_LABELS[level]}
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

export function MonthlyView({
  viewMonth,
  map,
  selectedDate,
  onDateSelect,
}: {
  viewMonth: Date;
  map: Map<string, number>;
  selectedDate?: string | null;
  onDateSelect?: (date: string) => void;
}) {
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = getDay(monthStart);
  const emptyCells = Array.from({ length: startWeekday });

  return (
    <div className="flex-1 w-full">

      {/* Day labels & cells (combined for perfect alignment) */}
      <div className="flex justify-center">
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {DAY_LABELS.map((d) => (
            <div key={d} className="flex items-end justify-center text-[10px] tracking-widest uppercase text-muted/60 pb-1">
              {d.charAt(0)}
            </div>
          ))}
          
          {/* Empty cells for first week offset */}
          {emptyCells.map((_, i) => <div key={`e-${i}`} />)}
          
          {/* Actual days */}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            return (
              <div key={dateStr}>
                <DayCell
                  date={day}
                  intensity={map.get(dateStr) ?? 0}
                  isFutureDate={isFuture(day)}
                  size="lg"
                  isSelected={selectedDate === dateStr}
                  onClick={onDateSelect}
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
  selectedDate,
  onDateSelect,
}: {
  viewYear: Date;
  map: Map<string, number>;
  selectedDate?: string | null;
  onDateSelect?: (date: string) => void;
}) {
  const yearStart = startOfYear(viewYear);

  const weeks = eachWeekOfInterval(
    { start: yearStart, end: new Date(viewYear.getFullYear(), 11, 31) },
    { weekStartsOn: 0 }
  );

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
                    size="sm"
                    isSelected={selectedDate === dateStr}
                    onClick={onDateSelect}
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

export function ContributionGraph({
  selectedDate,
  onDateSelect,
}: {
  selectedDate?: string | null;
  onDateSelect?: (date: string | null) => void;
}) {
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

  // Toggle: clicking an already-selected date clears the filter
  const handleDateClick = (dateStr: string) => {
    onDateSelect?.(selectedDate === dateStr ? null : dateStr);
  };

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

      {/* Unified Pagination Header */}
      <div className="flex items-center justify-between mb-6 max-w-xs mx-auto">
        <button
          onClick={viewMode === "month" ? goMonthPrev : goYearPrev}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-muted hover:text-foreground"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-serif text-foreground tracking-wide whitespace-nowrap px-4">
          {viewMode === "month" ? format(viewMonth, "MMMM yyyy") : format(viewYear, "yyyy")}
        </h2>
        <button
          onClick={viewMode === "month" ? goMonthNext : goYearNext}
          disabled={viewMode === "month" ? isMonthNextDisabled : isYearNextDisabled}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Heatmap + vertical legend */}
      <div className="flex gap-4 items-center justify-center min-h-[300px]">
        {viewMode === "month" ? (
          <MonthlyView
            viewMonth={viewMonth}
            map={map}
            selectedDate={selectedDate}
            onDateSelect={handleDateClick}
          />
        ) : (
          <YearlyView
            viewYear={viewYear}
            map={map}
            selectedDate={selectedDate}
            onDateSelect={handleDateClick}
          />
        )}
        <VerticalLegend />
      </div>

      {/* Stats */}
      {data && <StatsBar data={data} />}
    </div>
  );
}

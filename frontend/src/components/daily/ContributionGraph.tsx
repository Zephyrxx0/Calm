"use client";

import { useEffect, useState, memo, useCallback } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { subDays, format, parseISO, startOfYear, endOfYear } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "lucide-react";
import "react-calendar-heatmap/dist/styles.css";

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

// 5 intensity levels from muted to accent (#c2856b)
const INTENSITY_COLORS: Record<number, string> = {
  0: "#f0f0ed",
  1: "#e8d5c8",
  2: "#d9c0ab",
  3: "#caa38a",
  4: "#c2856b",
};

const CONSCIOUSNESS_LABELS: Record<number, string> = {
  0: "No entry",
  1: "Not conscious",
  2: "Slightly conscious",
  3: "Moderately conscious",
  4: "Very conscious",
  5: "Extremely conscious",
};

// Custom organic square overlay for crayon-drawn aesthetic
function OrganicSquareOverlay() {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect
        x="0.5"
        y="0.5"
        width="11"
        height="11"
        fill="none"
        stroke="rgba(26,26,26,0.08)"
        strokeWidth="0.5"
        rx="0.5"
        strokeDasharray="1.5 1"
      />
    </svg>
  );
}

// Custom rect renderer for contribution squares with organic aesthetic
const CustomRect = memo(function CustomRect({
  day,
  className,
}: {
  day: Date;
  className?: string;
}) {
  return (
    <div className="relative">
      <div className={className} />
      <OrganicSquareOverlay />
    </div>
  );
});

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Calendar className="h-10 w-10 text-muted mb-4 opacity-30" />
      <h3 className="text-sm font-serif text-foreground mb-2">
        Start Your Carbon Journey
      </h3>
      <p className="text-xs font-sans text-muted max-w-xs">
        Track your first day to begin building your streak. Just 30 seconds.
      </p>
    </div>
  );
}

export function ContributionGraph() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchStreak() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch("/api/daily/streak", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load streak data");

        const json: StreakStats = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try refreshing the page."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStreak();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Build value map for calendar heatmap
  const valueMap = useCallback(() => {
    if (!data?.entries) return new Map<string, number>();
    return new Map(
      data.entries.map((e) => [e.date, e.carbon_consciousness])
    );
  }, [data]);

  const classForValue = useCallback(
    (value: { date: string; count?: number } | null) => {
      if (!value) return "fill-intensity-0";
      const intensity = valueMap().get(value.date) ?? 0;
      return `fill-intensity-${Math.min(intensity, 4)}`;
    },
    [valueMap]
  );

  const titleForValue = useCallback(
    (value: { date: string; count?: number } | null) => {
      if (!value) return "No entry";
      const intensity = valueMap().get(value.date) ?? 0;
      const label = CONSCIOUSNESS_LABELS[intensity] ?? "No data";
      return `${format(parseISO(value.date), "MMM d, yyyy")} — ${label}`;
    },
    [valueMap]
  );

  const tooltipDataAttrs = useCallback(
    (value: { date: string; count?: number } | null) => {
      if (!value) return {};
      const intensity = valueMap().get(value.date) ?? 0;
      return {
        "data-tooltip": `${format(parseISO(value.date), "MMM d, yyyy")}: ${CONSCIOUSNESS_LABELS[intensity]}`,
      };
    },
    [valueMap]
  );

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Spinner className="h-6 w-6 text-accent" />
        <p className="text-xs text-muted font-sans mt-3">
          Loading your carbon story...
        </p>
        {/* Skeleton grid */}
        <div className="mt-6 grid grid-cols-7 gap-[2px] opacity-20">
          {Array.from({ length: 91 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-[1px] bg-border"
              style={{
                animationDelay: `${i * 5}ms`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-xs text-destructive font-sans">{error}</p>
      </div>
    );
  }

  const today = new Date();
  const startDate = startOfYear(today);
  const endDate = endOfYear(today);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full font-sans">
        {/* Streak Stats */}
        {data && (
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-2xl font-serif text-foreground">
                {data.current_streak}
              </p>
              <p className="text-[10px] tracking-[0.15em] uppercase text-muted mt-0.5">
                Current Streak
              </p>
            </div>
            <div className="w-px h-8 bg-border" aria-hidden="true" />
            <div className="text-center">
              <p className="text-2xl font-serif text-foreground">
                {data.longest_streak}
              </p>
              <p className="text-[10px] tracking-[0.15em] uppercase text-muted mt-0.5">
                Longest Streak
              </p>
            </div>
            <div className="w-px h-8 bg-border" aria-hidden="true" />
            <div className="text-center">
              <p className="text-2xl font-serif text-foreground">
                {data.total_days}
              </p>
              <p className="text-[10px] tracking-[0.15em] uppercase text-muted mt-0.5">
                Total Days
              </p>
            </div>
          </div>
        )}

        {/* Contribution Calendar */}
        <div className="w-full overflow-x-auto pb-2">
          <div className="min-w-[680px]">
            <CalendarHeatmap
              startDate={startDate}
              endDate={endDate}
              values={
                data?.entries.map((e) => ({ date: e.date })) ?? []
              }
              classForValue={classForValue}
              titleForValue={titleForValue}
              tooltipDataAttrs={tooltipDataAttrs}
              showWeekdayLabels={true}
              gutterSize={2}
              horizontal={true}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="text-[10px] tracking-[0.1em] uppercase text-muted mr-1">
            Less
          </span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="relative"
              title={CONSCIOUSNESS_LABELS[level]}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.5"
                  y="0.5"
                  width="11"
                  height="11"
                  rx="1"
                  fill={INTENSITY_COLORS[level]}
                  stroke="rgba(26,26,26,0.08)"
                  strokeWidth="0.5"
                />
              </svg>
            </div>
          ))}
          <span className="text-[10px] tracking-[0.1em] uppercase text-muted ml-1">
            More
          </span>
        </div>
      </div>

      {/* Custom CSS for calendar heatmap intensity */}
      <style jsx global>{`
        .react-calendar-heatmap .fill-intensity-0 {
          fill: ${INTENSITY_COLORS[0]};
        }
        .react-calendar-heatmap .fill-intensity-1 {
          fill: ${INTENSITY_COLORS[1]};
        }
        .react-calendar-heatmap .fill-intensity-2 {
          fill: ${INTENSITY_COLORS[2]};
        }
        .react-calendar-heatmap .fill-intensity-3 {
          fill: ${INTENSITY_COLORS[3]};
        }
        .react-calendar-heatmap .fill-intensity-4 {
          fill: ${INTENSITY_COLORS[4]};
        }

        .react-calendar-heatmap text {
          font-size: 9px;
          font-family: var(--font-sans), sans-serif;
          fill: #8a8a7a;
        }

        .react-calendar-heatmap rect {
          rx: 1.5px;
          stroke: rgba(26, 26, 26, 0.06);
          stroke-width: 0.5px;
          transition: opacity 150ms var(--ease-fluid);
        }

        .react-calendar-heatmap rect:hover {
          opacity: 0.85;
          stroke: rgba(194, 133, 107, 0.4);
          stroke-width: 1px;
        }

        .react-calendar-heatmap .react-calendar-heatmap-small-text {
          font-size: 8px;
        }

        .react-calendar-heatmap
          .color-empty {
          fill: #f0f0ed;
        }
      `}</style>
    </TooltipProvider>
  );
}

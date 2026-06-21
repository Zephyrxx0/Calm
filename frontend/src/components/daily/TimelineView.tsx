"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
} from "@/components/ui/timeline";
import { Spinner } from "@/components/ui/spinner";
import { format, parseISO } from "date-fns";
import {
  Car,
  Bike,
  Zap,
  MessageCircle,
  Receipt,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

type ActivityType = "quick_log" | "chat_reflection" | "receipt_scan" | "interview";

interface ActivityLog {
  id: number;
  activity_type: ActivityType;
  consciousness_score: number;
  metadata: Record<string, unknown>;
  logged_at: string;
}

interface TimelinePage {
  items: ActivityLog[];
  next_cursor: number | null;
}

// ─── Label helpers ─────────────────────────────────────────────────────────

const TRANSPORT_LABELS: Record<string, string> = {
  bicycle: "Bicycle / Walking",
  public_transit: "Public Transit",
  ev: "EV",
  car: "Petrol Car",
  flight: "Flight",
  none: "Stayed Home",
};
function transportLabel(v: string) {
  return TRANSPORT_LABELS[v] ?? v;
}

const MEAL_LABELS: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  pescatarian: "Pescatarian",
  balanced: "Balanced",
  red_meat: "Red Meat",
};
function mealLabel(v: string) {
  return MEAL_LABELS[v] ?? v;
}

const ENERGY_LABELS: Record<string, string> = {
  low: "Low Usage",
  moderate: "Moderate",
  high: "High Usage",
  renewable: "Renewable",
};
function energyLabel(v: string) {
  return ENERGY_LABELS[v] ?? v;
}

const SCORE_LABELS: Record<number, string> = {
  1: "Not conscious",
  2: "Slightly",
  3: "Moderate",
  4: "Very conscious",
  5: "Extremely conscious",
};

// ─── Transport icon picker ─────────────────────────────────────────────────

function TransportIcon({ value, className }: { value?: string; className?: string }) {
  if (value === "bicycle" || value === "walking") return <Bike className={className} />;
  if (value === "car" || value === "suv" || value === "flight") return <Car className={className} />;
  return <Zap className={className} />;
}

// ─── Score pip ─────────────────────────────────────────────────────────────

function ScorePip({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-[3px]" aria-label={`Score: ${SCORE_LABELS[score] ?? score}`}>
      {[1, 2, 3, 4, 5].map((d) => (
        <span
          key={d}
          className="inline-block w-[5px] h-[5px] rounded-full transition-colors"
          style={{
            backgroundColor: d <= score ? "var(--color-accent)" : "var(--color-border)",
          }}
        />
      ))}
    </span>
  );
}

// ─── Expanded detail renderers ─────────────────────────────────────────────

function QuickLogDetail({ meta }: { meta: Record<string, unknown> }) {
  const transport = meta.transport ? String(meta.transport) : null;
  const meal = meta.meal ? String(meta.meal) : null;
  const energy = meta.energy ? String(meta.energy) : null;
  const notes = meta.notes ? String(meta.notes) : null;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
      {transport && (
        <>
          <dt className="text-[9px] uppercase tracking-[0.18em] text-muted">Transport</dt>
          <dd className="text-xs text-foreground font-medium">{transportLabel(transport)}</dd>
        </>
      )}
      {meal && (
        <>
          <dt className="text-[9px] uppercase tracking-[0.18em] text-muted">Meal</dt>
          <dd className="text-xs text-foreground font-medium">{mealLabel(meal)}</dd>
        </>
      )}
      {energy && (
        <>
          <dt className="text-[9px] uppercase tracking-[0.18em] text-muted">Energy</dt>
          <dd className="text-xs text-foreground font-medium">{energyLabel(energy)}</dd>
        </>
      )}
      {notes && (
        <>
          <dt className="text-[9px] uppercase tracking-[0.18em] text-muted col-span-2 mt-1">Notes</dt>
          <dd className="text-xs text-foreground col-span-2 italic leading-relaxed">
            &ldquo;{notes}&rdquo;
          </dd>
        </>
      )}
    </dl>
  );
}


function ReflectionDetail({ meta }: { meta: Record<string, unknown> }) {
  const excerpt = meta.excerpt ? String(meta.excerpt) : "";
  return (
    <blockquote className="mt-3 border-l-2 border-accent/30 pl-3">
      <p className="text-xs text-foreground italic leading-relaxed">
        {excerpt ? `"${excerpt}"` : "No excerpt stored."}
      </p>
    </blockquote>
  );
}

function ReceiptDetail({ meta }: { meta: Record<string, unknown> }) {
  const items = Array.isArray(meta.items) ? (meta.items as string[]) : [];
  const merchant = meta.merchant ? String(meta.merchant) : null;
  const aiNote = meta.ai_note ? String(meta.ai_note) : null;
  return (
    <div className="mt-3 space-y-2">
      {merchant && (
        <p className="text-[9px] uppercase tracking-[0.18em] text-muted">
          Merchant:{" "}
          <span className="text-foreground font-medium normal-case">{merchant}</span>
        </p>
      )}
      {items.length > 0 && (
        <ul className="list-disc list-inside space-y-0.5">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-foreground/80">
              {item}
            </li>
          ))}
        </ul>
      )}
      {aiNote && (
        <p className="text-xs text-muted italic mt-2">{aiNote}</p>
      )}
    </div>
  );
}


function InterviewDetail({ meta }: { meta: Record<string, unknown> }) {
  const tonnes = meta.total_tonnes != null ? Number(meta.total_tonnes).toFixed(3) : null;
  const mode = meta.mode ? String(meta.mode) : null;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
      {tonnes && (
        <>
          <dt className="text-[9px] uppercase tracking-[0.18em] text-muted">Estimated CO₂</dt>
          <dd className="text-xs text-foreground font-medium">{tonnes} t</dd>
        </>
      )}
      {mode && (
        <>
          <dt className="text-[9px] uppercase tracking-[0.18em] text-muted">Mode</dt>
          <dd className="text-xs text-foreground font-medium capitalize">{mode}</dd>
        </>
      )}
    </dl>
  );
}

// ─── Activity config (defined after helpers so they're in scope) ────────────

function activityConfig(type: ActivityType) {
  switch (type) {
    case "quick_log":
      return {
        label: "Quick Log",
        Icon: Zap,
        briefTitle: (meta: Record<string, unknown>) => {
          const parts: string[] = [];
          if (meta.transport) parts.push(transportLabel(String(meta.transport)));
          if (meta.meal) parts.push(mealLabel(String(meta.meal)));
          if (meta.energy) parts.push(energyLabel(String(meta.energy)));
          return parts.length > 0 ? parts.join(" · ") : "Daily activity logged";
        },
      };
    case "chat_reflection":
      return {
        label: "Reflection",
        Icon: MessageCircle,
        briefTitle: (meta: Record<string, unknown>) =>
          meta.excerpt ? `"${String(meta.excerpt).slice(0, 60)}${String(meta.excerpt).length > 60 ? "…" : ""}"` : "Personal reflection",
      };
    case "receipt_scan":
      return {
        label: "Receipt Scan",
        Icon: Receipt,
        briefTitle: (meta: Record<string, unknown>) =>
          meta.merchant ? String(meta.merchant) : "Receipt scanned",
      };
    case "interview":
      return {
        label: "Interview",
        Icon: FileText,
        briefTitle: (meta: Record<string, unknown>) =>
          meta.total_tonnes != null
            ? `${Number(meta.total_tonnes).toFixed(2)} t CO₂ estimated`
            : "Interview completed",
      };
    default:
      return {
        label: type,
        Icon: Zap,
        briefTitle: () => type,
      };
  }
}

// ─── Single Timeline Item ──────────────────────────────────────────────────

function ActivityTimelineItem({ log }: { log: ActivityLog }) {
  const [expanded, setExpanded] = useState(false);

  const { label, Icon, briefTitle } = activityConfig(log.activity_type);
  const title = briefTitle(log.metadata);
  const dateStr = format(parseISO(log.logged_at), "d MMM yyyy");
  const timeStr = format(parseISO(log.logged_at), "HH:mm");

  return (
    <TimelineItem>
      {/* Vertical connecting line */}
      <TimelineConnector className="bg-foreground/25" />

      {/* Dot — light bg, dark border, dark icon */}
      <TimelineDot
        className="border-2 border-foreground/70 bg-background shadow-sm"
        style={{ "--timeline-dot-size": "2rem" } as React.CSSProperties}
      >
        {log.activity_type === "quick_log" ? (
          <TransportIcon
            value={String(log.metadata.transport ?? "")}
            className="w-4 h-4 text-foreground"
          />
        ) : (
          <Icon className="w-4 h-4 text-foreground" />
        )}
      </TimelineDot>

      {/* Content card */}
      <TimelineContent className="pb-6 last:pb-0">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full text-left group rounded-lg"
          aria-expanded={expanded}
          aria-label={`${label}: ${title}`}
        >
          {/* ── Brief row ── */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-[0.18em] text-muted mb-1 font-sans">
                {label}
              </p>
              <p className="text-lg font-serif font-bold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-150">
                {title}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
              <ScorePip score={log.consciousness_score} />
              <time
                dateTime={log.logged_at}
                className="text-[9px] tracking-wide text-muted/60 whitespace-nowrap"
              >
                {dateStr}
              </time>
              <time className="text-[9px] text-muted/40">{timeStr}</time>
            </div>
          </div>

          {/* Expand chevron */}
          <div className="flex items-center gap-1 mt-2 text-muted/30 group-hover:text-muted/60 transition-colors">
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            <span className="text-[9px] uppercase tracking-[0.15em]">
              {expanded ? "Collapse" : "Details"}
            </span>
          </div>
        </button>

        {/* ── Expanded detail ── */}
        {expanded && (
          <div
            className="mt-3 pt-3 border-t border-border/25 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {/* Consciousness score row */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] uppercase tracking-[0.18em] text-muted">
                Consciousness
              </span>
              <span className="text-xs text-foreground font-medium">
                {SCORE_LABELS[log.consciousness_score] ?? log.consciousness_score}
              </span>
            </div>

            {/* Type-specific details */}
            {log.activity_type === "quick_log" && <QuickLogDetail meta={log.metadata} />}
            {log.activity_type === "chat_reflection" && <ReflectionDetail meta={log.metadata} />}
            {log.activity_type === "receipt_scan" && <ReceiptDetail meta={log.metadata} />}
            {log.activity_type === "interview" && <InterviewDetail meta={log.metadata} />}

            {/* Precise timestamp footer */}
            <p className="text-[9px] text-muted/40 mt-3 tracking-wide">
              Logged {format(parseISO(log.logged_at), "EEEE, d MMMM yyyy 'at' HH:mm")}
            </p>
          </div>
        )}
      </TimelineContent>
    </TimelineItem>
  );
}

// ─── Main TimelineView ───────────────────────────────────────────────────

export function TimelineView({
  filterDate,
  onClearFilter,
}: {
  filterDate?: string | null;
  onClearFilter?: () => void;
}) {
  const { user } = useAuth();
  const [allItems, setAllItems] = useState<ActivityLog[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);
  const seenIdsRef = useRef<Set<number>>(new Set());

  const fetchPage = useCallback(
    async (cursor?: number) => {
      if (!user || fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      setError(false);

      try {
        const token = await user.getIdToken();
        const params = new URLSearchParams({ limit: "20" });
        if (cursor !== undefined) params.set("before_id", String(cursor));
        if (filterDate) params.set("target_date", filterDate);

        const res = await fetch(`/api/daily/logs?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("fetch failed");

        const data: TimelinePage = await res.json();
        setAllItems((prev) => {
          const fresh = data.items.filter((item) => {
            if (seenIdsRef.current.has(item.id)) return false;
            seenIdsRef.current.add(item.id);
            return true;
          });
          return [...prev, ...fresh];
        });
        setNextCursor(data.next_cursor);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [user, filterDate]
  );

  // Reset when filterDate changes
  useEffect(() => {
    setAllItems([]);
    seenIdsRef.current = new Set();
    setNextCursor(undefined);
    fetchingRef.current = false;
  }, [filterDate]);

  // Initial load on mount
  useEffect(() => {
    if (user && nextCursor === undefined) {
      fetchPage(undefined);
    }
  }, [user, nextCursor, fetchPage]);

  // Intersection Observer — loads next page when sentinel scrolls into view
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0].isIntersecting;
        const hasMore = nextCursor !== null && nextCursor !== undefined;
        if (isVisible && hasMore && !fetchingRef.current) {
          fetchPage(nextCursor);
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, fetchPage]);

  // ── Initial loading skeleton ──
  if (nextCursor === undefined && loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-5 w-5 text-accent" />
      </div>
    );
  }

  // ── Empty state ──
  if (!loading && allItems.length === 0 && nextCursor === null) {
    return (
      <div className="py-12 text-center">
        <p className="text-xs text-muted tracking-wide">No activity logged yet.</p>
        <p className="text-[10px] text-muted/50 mt-1">
          Use the ⚡ button below to start tracking.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Activity timeline" className="w-full">
      {/* Section header — broadsheet style */}
      <div className="flex items-baseline justify-between mb-8 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-serif text-foreground tracking-wide">Activity Log</h2>
          {/* Active date filter pill */}
          {filterDate && (
            <button
              onClick={onClearFilter}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-foreground/20 bg-foreground/5 text-[9px] uppercase tracking-[0.15em] text-foreground hover:bg-foreground/10 transition-colors"
            >
              {format(parseISO(filterDate), "d MMM yyyy")}
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
        {allItems.length > 0 && (
          <span className="text-[9px] uppercase tracking-[0.2em] text-muted">
            {allItems.length} entr{allItems.length === 1 ? "y" : "ies"}
          </span>
        )}
      </div>

      {allItems.length > 0 && (
        <Timeline orientation="vertical" variant="default" className="[--timeline-dot-size:1.625rem]">
          {allItems.map((log) => (
            <ActivityTimelineItem key={log.id} log={log} />
          ))}
        </Timeline>
      )}

      {/* Invisible scroll sentinel — triggers next page load */}
      <div ref={sentinelRef} className="h-px" aria-hidden="true" />

      {/* Loading more indicator */}
      {loading && allItems.length > 0 && (
        <div className="flex justify-center py-8">
          <Spinner className="h-4 w-4 text-accent" />
        </div>
      )}

      {/* End of list */}
      {!loading && nextCursor === null && allItems.length > 0 && (
        <p className="text-center text-[9px] uppercase tracking-[0.2em] text-muted/30 py-10">
          ✦ End of record ✦
        </p>
      )}

      {/* Error + retry */}
      {error && (
        <div className="text-center py-6">
          <p className="text-xs text-muted">Failed to load entries.</p>
          <button
            onClick={() => fetchPage(nextCursor ?? undefined)}
            className="mt-2 text-[10px] uppercase tracking-widest text-accent hover:underline"
          >
            Retry
          </button>
        </div>
      )}
    </section>
  );
}

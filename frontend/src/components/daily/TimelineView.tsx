"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
const MEAL_LABELS: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  pescatarian: "Pescatarian",
  balanced: "Balanced",
  red_meat: "Red Meat",
};
const ENERGY_LABELS: Record<string, string> = {
  low: "Low Usage",
  moderate: "Moderate",
  high: "High Usage",
  renewable: "Renewable",
};
const SCORE_LABELS: Record<number, string> = {
  1: "Not conscious",
  2: "Slightly",
  3: "Moderate",
  4: "Very conscious",
  5: "Extremely conscious",
};

function tlabel(v: string, map: Record<string, string>) {
  return map[v] ?? v;
}

// ─── Activity helpers ───────────────────────────────────────────────────────

function activityIcon(log: ActivityLog, className = "w-3.5 h-3.5") {
  if (log.activity_type === "quick_log") {
    const t = String(log.metadata.transport ?? "");
    if (t === "bicycle" || t === "walking") return <Bike className={className} />;
    if (t === "car" || t === "suv" || t === "flight") return <Car className={className} />;
    return <Zap className={className} />;
  }
  if (log.activity_type === "chat_reflection") return <MessageCircle className={className} />;
  if (log.activity_type === "receipt_scan") return <Receipt className={className} />;
  return <FileText className={className} />;
}

function activityLabel(type: ActivityType) {
  switch (type) {
    case "quick_log": return "Quick Log";
    case "chat_reflection": return "Reflection";
    case "receipt_scan": return "Receipt Scan";
    case "interview": return "Interview";
    default: return type;
  }
}

function activityTitle(log: ActivityLog): string {
  const m = log.metadata;
  switch (log.activity_type) {
    case "quick_log": {
      const parts: string[] = [];
      if (m.transport) parts.push(tlabel(String(m.transport), TRANSPORT_LABELS));
      if (m.meal) parts.push(tlabel(String(m.meal), MEAL_LABELS));
      if (m.energy) parts.push(tlabel(String(m.energy), ENERGY_LABELS));
      return parts.length ? parts.join(" · ") : "Daily activity logged";
    }
    case "chat_reflection": {
      const ex = m.excerpt ? String(m.excerpt) : "";
      return ex ? `"${ex.slice(0, 60)}${ex.length > 60 ? "…" : ""}"` : "Personal reflection";
    }
    case "receipt_scan":
      return m.merchant ? String(m.merchant) : "Receipt scanned";
    case "interview":
      return m.total_tonnes != null
        ? `${Number(m.total_tonnes).toFixed(2)} t CO₂ estimated`
        : "Interview completed";
    default:
      return log.activity_type;
  }
}

// ─── Score pip ─────────────────────────────────────────────────────────────

function ScorePip({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-[3px]" aria-label={SCORE_LABELS[score] ?? String(score)}>
      {[1, 2, 3, 4, 5].map((d) => (
        <span
          key={d}
          className="inline-block w-[5px] h-[5px] rounded-full"
          style={{ backgroundColor: d <= score ? "var(--color-accent)" : "var(--color-border)" }}
        />
      ))}
    </span>
  );
}

// ─── Expanded detail for a single activity ─────────────────────────────────

function ActivityDetail({ log }: { log: ActivityLog }) {
  const m = log.metadata;

  if (log.activity_type === "quick_log") {
    const transport = m.transport ? String(m.transport) : null;
    const meal = m.meal ? String(m.meal) : null;
    const energy = m.energy ? String(m.energy) : null;
    const notes = m.notes ? String(m.notes) : null;
    return (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
        {transport && (
          <><dt className="text-[9px] uppercase tracking-[0.16em] text-muted">Transport</dt>
          <dd className="text-xs text-foreground font-medium">{tlabel(transport, TRANSPORT_LABELS)}</dd></>
        )}
        {meal && (
          <><dt className="text-[9px] uppercase tracking-[0.16em] text-muted">Meal</dt>
          <dd className="text-xs text-foreground font-medium">{tlabel(meal, MEAL_LABELS)}</dd></>
        )}
        {energy && (
          <><dt className="text-[9px] uppercase tracking-[0.16em] text-muted">Energy</dt>
          <dd className="text-xs text-foreground font-medium">{tlabel(energy, ENERGY_LABELS)}</dd></>
        )}
        {notes && (
          <><dt className="text-[9px] uppercase tracking-[0.16em] text-muted col-span-2">Notes</dt>
          <dd className="text-xs text-foreground col-span-2 italic">&ldquo;{notes}&rdquo;</dd></>
        )}
      </dl>
    );
  }

  if (log.activity_type === "chat_reflection") {
    const excerpt = m.excerpt ? String(m.excerpt) : null;
    return (
      <blockquote className="mt-2 border-l-2 border-foreground/20 pl-2.5">
        <p className="text-xs text-foreground italic leading-relaxed">
          {excerpt ? `"${excerpt}"` : "No excerpt stored."}
        </p>
      </blockquote>
    );
  }

  if (log.activity_type === "receipt_scan") {
    const items = Array.isArray(m.items) ? (m.items as string[]) : [];
    const merchant = m.merchant ? String(m.merchant) : null;
    const aiNote = m.ai_note ? String(m.ai_note) : null;
    return (
      <div className="mt-2 space-y-1.5">
        {merchant && <p className="text-xs text-foreground font-medium">{merchant}</p>}
        {items.length > 0 && (
          <ul className="list-disc list-inside space-y-0.5">
            {items.map((item, i) => <li key={i} className="text-xs text-foreground/70">{item}</li>)}
          </ul>
        )}
        {aiNote && <p className="text-xs text-muted italic">{aiNote}</p>}
      </div>
    );
  }

  if (log.activity_type === "interview") {
    const tonnes = m.total_tonnes != null ? Number(m.total_tonnes).toFixed(3) : null;
    const mode = m.mode ? String(m.mode) : null;
    return (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
        {tonnes && (
          <><dt className="text-[9px] uppercase tracking-[0.16em] text-muted">Estimated CO₂</dt>
          <dd className="text-xs text-foreground font-medium">{tonnes} t</dd></>
        )}
        {mode && (
          <><dt className="text-[9px] uppercase tracking-[0.16em] text-muted">Mode</dt>
          <dd className="text-xs text-foreground font-medium capitalize">{mode}</dd></>
        )}
      </dl>
    );
  }

  return null;
}

// ─── Single activity row (within a day group) ──────────────────────────────

function ActivityRow({ log }: { log: ActivityLog }) {
  const [expanded, setExpanded] = useState(false);
  const title = activityTitle(log);
  const timeStr = format(parseISO(log.logged_at), "HH:mm");

  return (
    <div className="border-t border-border/20 first:border-t-0">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left py-2.5 group"
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-2.5">
          {/* Activity type icon */}
          <span className="mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center bg-foreground/5">
            {activityIcon(log, "w-3 h-3 text-foreground/60")}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted">
              {activityLabel(log.activity_type)}
            </p>
            <p className="text-sm font-serif font-semibold text-foreground leading-snug line-clamp-1 group-hover:text-accent transition-colors">
              {title}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <ScorePip score={log.consciousness_score} />
            <span className="text-[9px] text-muted/50">{timeStr}</span>
            {expanded
              ? <ChevronUp className="w-3 h-3 text-muted/30" />
              : <ChevronDown className="w-3 h-3 text-muted/30" />
            }
          </div>
        </div>
      </button>

      {expanded && (
        <div className="pb-3 pl-7 animate-in fade-in slide-in-from-top-1 duration-150">
          <ActivityDetail log={log} />
          <p className="text-[9px] text-muted/40 mt-2">
            Logged {format(parseISO(log.logged_at), "EEEE, d MMMM 'at' HH:mm")}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Day group (one timeline node per calendar day) ─────────────────────────

function DayGroup({ day, items }: { day: string; items: ActivityLog[] }) {
  const [expanded, setExpanded] = useState(true); // open by default
  const date = parseISO(day);
  const isToday = day === format(new Date(), "yyyy-MM-dd");
  const avgScore = Math.round(
    items.reduce((sum, i) => sum + i.consciousness_score, 0) / items.length
  );

  return (
    <TimelineItem>
      <TimelineConnector className="bg-foreground/20" />

      {/* Day dot */}
      <TimelineDot
        className="border-2 border-foreground/60 bg-background"
        style={{ "--timeline-dot-size": "0.75rem" } as React.CSSProperties}
      />

      <TimelineContent className="pb-8 last:pb-0">
        {/* Day header — clickable to expand/collapse */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full text-left group mb-0.5"
        >
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-serif font-bold text-foreground group-hover:text-accent transition-colors">
                {isToday ? "Today" : format(date, "d MMMM")}
              </p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-muted">
                {format(date, "EEEE")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted/50">
                {items.length} {items.length === 1 ? "entry" : "entries"}
              </span>
              <ScorePip score={avgScore} />
              {expanded
                ? <ChevronUp className="w-3 h-3 text-muted/30" />
                : <ChevronDown className="w-3 h-3 text-muted/30" />
              }
            </div>
          </div>
        </button>

        {/* Activity list */}
        {expanded && (
          <div className="mt-1 rounded-lg border border-border/30 bg-background/50 px-3 animate-in fade-in duration-150">
            {items.map((log) => (
              <ActivityRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </TimelineContent>
    </TimelineItem>
  );
}

// ─── Main TimelineView ──────────────────────────────────────────────────────
// NOTE: parent should pass `key` to force remount when the user logs a new
// entry or changes the selected date (avoids internal reset race conditions).

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
  const fetchingMoreRef = useRef(false);

  // Initial fetch + refetch on filter change.  Stale-flag pattern handles
  // React strict-mode double-invoke and rapid filterDate changes.
  useEffect(() => {
    if (!user) return;

    let stale = false;
    console.log("[TimelineView] starting fetch, filterDate=", filterDate);

    setAllItems([]);
    setNextCursor(undefined);
    setError(false);
    setLoading(true);

    (async () => {
      try {
        const token = await user.getIdToken();
        if (stale) return;

        const params = new URLSearchParams({ limit: "20" });
        if (filterDate) params.set("target_date", filterDate);

        const res = await fetch(`/api/daily/logs?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (stale) return;

        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        const data: TimelinePage = await res.json();
        if (stale) return;

        console.log("[TimelineView] received", data.items.length, "items");
        setAllItems(data.items);
        setNextCursor(data.next_cursor);
      } catch (e) {
        if (stale) return;
        console.error("[TimelineView] fetch error:", e);
        setError(true);
      } finally {
        if (!stale) setLoading(false);
      }
    })();

    return () => {
      stale = true;
    };
  }, [user, filterDate]);

  // Pagination — load older pages as the sentinel enters the viewport.
  const loadMore = useCallback(async () => {
    if (!user || nextCursor == null || fetchingMoreRef.current) return;
    fetchingMoreRef.current = true;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        limit: "20",
        before_id: String(nextCursor),
      });
      if (filterDate) params.set("target_date", filterDate);
      const res = await fetch(`/api/daily/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const data: TimelinePage = await res.json();
      setAllItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = data.items.filter((it) => !seen.has(it.id));
        return [...prev, ...fresh];
      });
      setNextCursor(data.next_cursor);
    } catch (e) {
      console.error("[TimelineView] loadMore error:", e);
    } finally {
      setLoading(false);
      fetchingMoreRef.current = false;
    }
  }, [user, nextCursor, filterDate]);

  // Intersection Observer — loads next page as sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Group items by calendar day (descending order preserved)
  const dayGroups = useMemo(() => {
    const map = new Map<string, ActivityLog[]>();
    for (const item of allItems) {
      const day = format(parseISO(item.logged_at), "yyyy-MM-dd");
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(item);
    }
    return Array.from(map.entries()); // already in desc order from API
  }, [allItems]);

  // ── Not authenticated yet ──
  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-xs text-muted tracking-wide">
          Sign in to view your activity.
        </p>
      </div>
    );
  }

  // ── Initial fetch hasn't finished yet ──
  // (`nextCursor === undefined` means we have never received a successful
  // response for *this* mount — show a spinner unless we actively errored.)
  if (nextCursor === undefined) {
    if (error) {
      return (
        <div className="py-12 text-center">
          <p className="text-xs text-muted">Couldn’t load your activity.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-[10px] uppercase tracking-widest text-accent hover:underline"
          >
            Retry
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-5 w-5 text-accent" />
      </div>
    );
  }

  // ── Empty (fetch succeeded but nothing to show) ──
  if (allItems.length === 0 && nextCursor === null) {
    return (
      <div className="py-12 text-center">
        <p className="text-xs text-muted tracking-wide">
          {filterDate
            ? `No activity logged on ${format(parseISO(filterDate), "d MMMM yyyy")}.`
            : "No activity logged yet."}
        </p>
        {filterDate && (
          <button
            onClick={onClearFilter}
            className="mt-2 text-[10px] uppercase tracking-widest text-accent hover:underline"
          >
            View all days
          </button>
        )}
      </div>
    );
  }

  return (
    <section aria-label="Activity timeline" className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-serif text-foreground tracking-wide">Activity Log</h2>
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
            {dayGroups.length} day{dayGroups.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {dayGroups.length > 0 && (
        <Timeline orientation="vertical" variant="default" className="[--timeline-dot-size:0.75rem]">
          {dayGroups.map(([day, items]) => (
            <DayGroup key={day} day={day} items={items} />
          ))}
        </Timeline>
      )}

      {/* Scroll sentinel */}
      <div ref={sentinelRef} className="h-px" aria-hidden="true" />

      {/* Loading more */}
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

      {/* Error */}
      {error && (
        <div className="text-center py-6">
          <p className="text-xs text-muted">Failed to load entries.</p>
          <button
            onClick={() => loadMore()}
            className="mt-2 text-[10px] uppercase tracking-widest text-accent hover:underline"
          >
            Retry
          </button>
        </div>
      )}
    </section>
  );
}

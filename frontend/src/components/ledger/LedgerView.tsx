"use client";

import { DoodleLeaf, DoodlePebbles } from "@/components/OrganicDoodles";

interface LedgerEntry {
  id: number;
  description: string;
  category: string;
  carbon_impact: number;
}

interface LedgerViewProps {
  entries: LedgerEntry[];
  totalFootprint: number;
  categoryBreakdown: Record<string, number>;
}

function LedgerView({ entries, totalFootprint, categoryBreakdown }: LedgerViewProps) {
  return (
    <div className="space-y-6">
      {/* Total + Breakdown */}
      <div className="bg-background/80 border border-border/30 rounded-2xl p-6 relative overflow-hidden">
        <DoodlePebbles className="absolute -top-4 -right-4 w-24 h-24" />
        <p className="text-xs uppercase tracking-[0.15em] text-muted font-sans mb-1">
          Total Carbon Footprint
        </p>
        <p className="text-3xl font-serif text-foreground">
          {totalFootprint.toFixed(1)} <span className="text-base text-muted">kg CO₂e</span>
        </p>
        {Object.keys(categoryBreakdown).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(categoryBreakdown).map(([cat, val]) => (
              <span key={cat} className="text-xs font-sans text-muted bg-accent/5 px-2 py-1 rounded-full">
                {cat}: {val.toFixed(1)} kg
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted/70 font-sans py-8">
          Your ledger is empty. Upload a receipt or bill to begin.
        </p>
      ) : (
        <ul className="space-y-0">
          {entries.map((entry, i) => (
            <li key={entry.id}>
              <div className="py-4 px-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-serif text-foreground">{entry.description}</p>
                    <p className="text-xs text-muted font-sans mt-0.5">{entry.category}</p>
                  </div>
                  <p className="text-sm font-sans text-foreground/80 whitespace-nowrap ml-4">
                    {entry.carbon_impact.toFixed(1)} kg
                  </p>
                </div>
              </div>
              {/* Organic divider instead of harsh line */}
              {i < entries.length - 1 && (
                <div className="flex items-center justify-center opacity-30">
                  <DoodleLeaf className="w-6 h-6" />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LedgerView;

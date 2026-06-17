"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DoodleBranch, DoodleSun } from "@/components/OrganicDoodles";
import { FileUpload } from "@/components/ledger/FileUpload";
import LedgerView from "@/components/ledger/LedgerView";

interface LedgerEntry {
  id: number;
  description: string;
  category: string;
  carbon_impact: number;
}

export default function LedgerPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [totalFootprint, setTotalFootprint] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLedger() {
      try {
        const res = await fetch(`/api/ledger/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries || []);
          setTotalFootprint(data.total_footprint || 0);
          setCategoryBreakdown(data.category_breakdown || {});
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLedger();
  }, [sessionId]);

  const handleUploadComplete = useCallback((data: unknown) => {
    const d = data as {
      entry: LedgerEntry;
      total_footprint: number;
      category_breakdown: Record<string, number>;
    };
    setEntries((prev) => [...prev, d.entry]);
    setTotalFootprint(d.total_footprint);
    setCategoryBreakdown(d.category_breakdown);
  }, []);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-sm text-muted font-sans">Loading your ledger...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      <DoodleBranch className="absolute -top-10 -right-16 w-72 h-72 text-accent/5 pointer-events-none" />
      <DoodleSun className="absolute bottom-20 -left-20 w-64 h-64 text-accent/5 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border/50 px-6 py-5 relative z-10 bg-background/50 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-serif text-foreground hover:text-accent transition-colors">
            Calm
          </Link>
          <p className="text-[10px] font-medium text-muted uppercase tracking-[0.2em]">
            The Ledger
          </p>
          <Link
            href="/interview"
            className="text-xs font-sans text-muted hover:text-foreground transition-colors"
          >
            ← Back to Interview
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 relative z-10 max-w-2xl mx-auto w-full px-6 py-8 space-y-8">
        <FileUpload sessionId={sessionId} onUploadComplete={handleUploadComplete} />
        <LedgerView
          entries={entries}
          totalFootprint={totalFootprint}
          categoryBreakdown={categoryBreakdown}
        />
      </div>
    </main>
  );
}

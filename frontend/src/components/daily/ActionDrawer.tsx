"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { X, Zap, MessageCircle, Receipt, ChevronRight } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type DrawerMode = "menu" | "quick" | "reflect" | "receipt";

interface ActionDrawerProps {
  onLogged?: () => void;
}

// ─── Transport / Meal / Energy options ──────────────────────────────────────

const TRANSPORT_OPTIONS = [
  { value: "bicycle", label: "Bicycle / Walking" },
  { value: "public_transit", label: "Public Transit" },
  { value: "ev", label: "EV / Electric Car" },
  { value: "car", label: "Petrol / Diesel Car" },
  { value: "flight", label: "Flight" },
  { value: "none", label: "Stayed Home" },
];

const MEAL_OPTIONS = [
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "balanced", label: "Balanced" },
  { value: "red_meat", label: "Red Meat" },
];

const ENERGY_OPTIONS = [
  { value: "low", label: "Low Usage" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High Usage" },
  { value: "renewable", label: "Renewable / Solar" },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-2 font-sans">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value === value ? "" : opt.value)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
              value === opt.value
                ? "border-accent bg-accent/10 text-accent font-medium"
                : "border-border text-muted hover:border-accent/40 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Form ──────────────────────────────────────────────────────────────

function QuickForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [transport, setTransport] = useState("");
  const [meal, setMeal] = useState("");
  const [energy, setEnergy] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/daily/log/quick", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transport, meal, energy, notes }),
      });
      setDone(true);
      setTimeout(onDone, 900);
    } catch {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-accent" />
        </div>
        <p className="text-sm font-serif text-foreground">Logged!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Select label="Transport" options={TRANSPORT_OPTIONS} value={transport} onChange={setTransport} />
      <Select label="Meals" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
      <Select label="Energy" options={ENERGY_OPTIONS} value={energy} onChange={setEnergy} />
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-2 font-sans">
          Notes (optional)
        </p>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. walked to the market, skipped AC..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || (!transport && !meal && !energy && !notes)}
        className="w-full rounded-xl bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-40"
      >
        {submitting ? "Logging..." : "Log Activity"}
      </button>
    </form>
  );
}

// ─── Chat Reflection ─────────────────────────────────────────────────────────

function ChatReflection({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const scoreLabels: Record<number, string> = {
    1: "Not conscious",
    2: "Slightly",
    3: "Moderate",
    4: "Very conscious",
    5: "Extremely conscious",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim() || submitting) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/daily/log/reflection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, consciousness_score: score }),
      });
      setDone(true);
      setTimeout(onDone, 900);
    } catch {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-accent" />
        </div>
        <p className="text-sm font-serif text-foreground">Reflection saved!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-2 font-sans">
          How did today go?
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="e.g. Took the bus to work, had a plant-based lunch, but left the AC on all day..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none leading-relaxed"
        />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-3 font-sans">
          How conscious were you? — <span className="text-accent normal-case">{scoreLabels[score]}</span>
        </p>
        <input
          type="range"
          min={1}
          max={5}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted">Low</span>
          <span className="text-[9px] text-muted">High</span>
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting || !message.trim()}
        className="w-full rounded-xl bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-40"
      >
        {submitting ? "Saving..." : "Save Reflection"}
      </button>
    </form>
  );
}

// ─── Receipt Upload ──────────────────────────────────────────────────────────

function ReceiptUpload({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [merchant, setMerchant] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; note: string; items: string[] } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || submitting) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const form = new FormData();
      form.append("file", file);
      if (merchant) form.append("merchant", merchant);

      const res = await fetch("/api/daily/log/receipt", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      setResult({
        score: data.consciousness_score,
        note: data.metadata?.ai_note || "",
        items: data.metadata?.items || [],
      });
      setTimeout(onDone, 2500);
    } catch {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-serif text-foreground">Receipt analysed</p>
            <p className="text-xs text-muted">{result.note}</p>
          </div>
        </div>
        {result.items.length > 0 && (
          <div className="bg-surface rounded-lg px-4 py-3 ring-1 ring-border/60">
            <p className="text-[10px] uppercase tracking-wider text-muted mb-2">Detected items</p>
            <ul className="text-xs text-foreground/80 space-y-1">
              {result.items.slice(0, 6).map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent inline-block" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          file
            ? "border-accent/50 bg-accent/5"
            : "border-border hover:border-accent/40 hover:bg-accent/5"
        }`}
      >
        <Receipt className="w-8 h-8 text-muted mx-auto mb-3" />
        {file ? (
          <p className="text-sm text-foreground">{file.name}</p>
        ) : (
          <>
            <p className="text-sm text-foreground mb-1">Tap to upload receipt</p>
            <p className="text-xs text-muted">JPG, PNG, or PDF — Gemini will analyse it</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      <input
        type="text"
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        placeholder="Merchant name (optional)"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      <button
        type="submit"
        disabled={!file || submitting}
        className="w-full rounded-xl bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-40"
      >
        {submitting ? "Analysing with Gemini..." : "Analyse Receipt"}
      </button>
    </form>
  );
}

// ─── Menu ────────────────────────────────────────────────────────────────────

function DrawerMenu({ onSelect }: { onSelect: (mode: DrawerMode) => void }) {
  const items: { mode: DrawerMode; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      mode: "quick",
      icon: <Zap className="w-4 h-4" />,
      title: "Quick Log",
      desc: "Transport, meals, energy in 10 seconds",
    },
    {
      mode: "reflect",
      icon: <MessageCircle className="w-4 h-4" />,
      title: "Reflect",
      desc: "Write how your day went",
    },
    {
      mode: "receipt",
      icon: <Receipt className="w-4 h-4" />,
      title: "Scan Receipt",
      desc: "Upload a receipt — Gemini analyses it",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {items.map(({ mode, icon, title, desc }) => (
        <button
          key={mode}
          onClick={() => onSelect(mode)}
          className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border hover:border-accent/40 hover:bg-accent/5 transition-all text-left group"
        >
          <span className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
            {icon}
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-foreground">{title}</span>
            <span className="block text-xs text-muted mt-0.5">{desc}</span>
          </span>
          <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
        </button>
      ))}
    </div>
  );
}

// ─── Main Drawer ─────────────────────────────────────────────────────────────

export function ActionDrawer({ onLogged }: ActionDrawerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DrawerMode>("menu");

  const close = () => {
    setOpen(false);
    setTimeout(() => setMode("menu"), 300);
  };

  const handleLogged = () => {
    onLogged?.();
    close();
  };

  const titles: Record<DrawerMode, string> = {
    menu: "Log Activity",
    quick: "Quick Log",
    reflect: "Reflect on Today",
    receipt: "Scan Receipt",
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-foreground text-background px-6 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-sm font-medium font-sans"
        aria-label="Log Activity"
      >
        <span className="text-lg leading-none">+</span>
        Log Activity
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl ring-1 ring-border/60 transition-transform duration-300 ease-out max-w-xl mx-auto ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxWidth: "42rem" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-6 pb-8 pt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {mode !== "menu" && (
                <button
                  onClick={() => setMode("menu")}
                  className="text-xs text-muted hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              )}
              <h3 className="text-base font-serif text-foreground">{titles[mode]}</h3>
            </div>
            <button
              onClick={close}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface transition-colors text-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          {mode === "menu" && <DrawerMenu onSelect={setMode} />}
          {mode === "quick" && <QuickForm onDone={handleLogged} />}
          {mode === "reflect" && <ChatReflection onDone={handleLogged} />}
          {mode === "receipt" && <ReceiptUpload onDone={handleLogged} />}
        </div>
      </div>
    </>
  );
}

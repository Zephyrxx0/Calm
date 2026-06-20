"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

const TRANSPORT_OPTIONS = [
  { value: "walk", label: "Walk" },
  { value: "bike", label: "Bike" },
  { value: "car", label: "Car" },
  { value: "transit", label: "Transit" },
  { value: "none", label: "None" },
] as const;

const MEAL_OPTIONS = ["0", "1", "2", "3", "4+"] as const;

const ENERGY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

const CONSCIOUSNESS_OPTIONS = ["1", "2", "3", "4", "5"] as const;

interface DailyFormData {
  transport_mode: string;
  meals_count: string;
  energy_usage: string;
  carbon_consciousness: string;
}

const INITIAL_FORM: DailyFormData = {
  transport_mode: "",
  meals_count: "",
  energy_usage: "",
  carbon_consciousness: "",
};

export function DailyForm() {
  const { user } = useAuth();
  const [form, setForm] = useState<DailyFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const updateField = useCallback(
    (field: keyof DailyFormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setError("");
    },
    []
  );

  const isComplete =
    form.transport_mode &&
    form.meals_count &&
    form.energy_usage &&
    form.carbon_consciousness;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || !user) return;

    setLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transport_mode: form.transport_mode,
          meals_count:
            form.meals_count === "4+"
              ? 4
              : parseInt(form.meals_count, 10),
          energy_usage: form.energy_usage,
          carbon_consciousness: parseInt(form.carbon_consciousness, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError("You already tracked today. Come back tomorrow.");
        } else {
          setError(data.detail || "Something went wrong. Please try again.");
        }
        return;
      }

      setSuccess(true);
      setForm(INITIAL_FORM);

      // Reset success indicator after animation
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full border border-[#e3dfd3] bg-white rounded-lg px-3 py-2.5 text-sm font-sans text-[#2d2c29] outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 transition-all";
  const labelClasses =
    "block text-xs tracking-[0.12em] uppercase text-muted font-sans mb-2";

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent animate-[fade-up_0.3s_var(--ease-fluid)]">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm font-sans">Entry saved — see you tomorrow</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm font-sans">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Transport Mode */}
        <fieldset>
          <legend className={labelClasses}>How did you get around today?</legend>
          <RadioGroup
            value={form.transport_mode}
            onValueChange={(v) => updateField("transport_mode", v)}
            className="grid grid-cols-5 gap-2"
          >
            {TRANSPORT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-sans cursor-pointer transition-all ${
                  form.transport_mode === opt.value
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-[#e3dfd3] bg-white text-muted hover:border-accent/50"
                }`}
              >
                <RadioGroupItem
                  value={opt.value}
                  id={`transport-${opt.value}`}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </RadioGroup>
        </fieldset>

        {/* Meals Count */}
        <fieldset>
          <legend className={labelClasses}>How many meals did you have?</legend>
          <Select
            value={form.meals_count}
            onValueChange={(v) => updateField("meals_count", v)}
          >
            <SelectTrigger className={inputClasses}>
              <SelectValue placeholder="Select meals..." />
            </SelectTrigger>
            <SelectContent>
              {MEAL_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === "4+" ? "4 or more" : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </fieldset>

        {/* Energy Usage */}
        <fieldset>
          <legend className={labelClasses}>Your energy use today felt...</legend>
          <RadioGroup
            value={form.energy_usage}
            onValueChange={(v) => updateField("energy_usage", v)}
            className="grid grid-cols-3 gap-2"
          >
            {ENERGY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-sans cursor-pointer transition-all ${
                  form.energy_usage === opt.value
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-[#e3dfd3] bg-white text-muted hover:border-accent/50"
                }`}
              >
                <RadioGroupItem
                  value={opt.value}
                  id={`energy-${opt.value}`}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </RadioGroup>
        </fieldset>

        {/* Carbon Consciousness */}
        <fieldset>
          <legend className={labelClasses}>
            How conscious of your carbon impact were you today?
          </legend>
          <Select
            value={form.carbon_consciousness}
            onValueChange={(v) => updateField("carbon_consciousness", v)}
          >
            <SelectTrigger className={inputClasses}>
              <SelectValue placeholder="Rate 1–5..." />
            </SelectTrigger>
            <SelectContent>
              {CONSCIOUSNESS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt} —{" "}
                  {opt === "1"
                    ? "Not at all"
                    : opt === "2"
                    ? "Slightly"
                    : opt === "3"
                    ? "Moderately"
                    : opt === "4"
                    ? "Very"
                    : "Extremely"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </fieldset>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!isComplete || loading || !user}
          className="w-full h-11 text-sm tracking-[0.1em] uppercase bg-accent text-white hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Track Today"
          )}
        </Button>
      </form>
    </div>
  );
}

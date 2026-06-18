# Phase 3: The Summary, Enhanced - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-18
**Phase:** 3-The Summary, Enhanced
**Areas discussed:** Visualization, Benchmarks, Sharing, Insights, Actions, Persistence

---

## Visualization Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Recharts (Standard) | Industry standard, easy to implement, but look like standard charts. | ✓ |
| Custom Organic SVGs | Hand-drawn/organic look using SVG primitives. Consistent with OrganicDoodles.tsx. | ✓ |
| CSS-only (Minimal) | Minimalist, no external libraries. Uses Tailwind for simple bar/grid visuals. | |

**User's choice:** "1 and 2 both"
**Notes:** The user wants a hybrid approach where Recharts provides the data structure and custom organic SVGs provide the thematic aesthetic.

---

## Comparison Data (Benchmarks)

| Option | Description | Selected |
|--------|-------------|----------|
| National Average | User compares themselves against their own country's average. | |
| Global Average | Simpler, single data point (approx 4.7 tonnes CO2e per capita). | |
| Toggleable Benchmarks | Allow users to choose their comparison benchmark. | ✓ |

**User's choice:** Toggleable Benchmarks
**Notes:** Users should be able to switch between different data points for context.

---

## Sharing Capabilities

| Option | Description | Selected |
|--------|-------------|----------|
| Download as Image/PDF | Generates a static image or PDF for the user to keep. | ✓ |
| Public Link | Creates a unique URL for the report. | ✓ |
| Social Share Cards | Generates a shareable card optimized for Twitter/LinkedIn. | ✓ |

**User's choice:** "all 3"
**Notes:** A comprehensive sharing suite is desired.

---

## Insights Engine

| Option | Description | Selected |
|--------|-------------|----------|
| AI-Generated (Gemini) | Gemini analyzes the full interview and ledger for unique patterns. | |
| Rule-Based (Logical) | Programmatic logic based on thresholds. | |
| Hybrid Approach | Rule-based logic for reliability, plus Gemini for 'flavor' and summary text. | ✓ |

**User's choice:** Hybrid Approach
**Notes:** Balances data accuracy with personalized AI content.

---

## Actionable Recommendations

| Option | Description | Selected |
|--------|-------------|----------|
| Specific Calculations | Deeply personalized (e.g. 'Your 20-mile commute...'). | |
| Generic Category Advice | General advice per category (e.g. 'Eat more plant-based'). | ✓ |
| Milestone-based | Focus on 1 big change per month to avoid overwhelm. | |

**User's choice:** Generic Category Advice
**Notes:** Keeps the initial enhancement focused and low-friction.

---

## Persistence for Sharing

| Option | Description | Selected |
|--------|-------------|----------|
| Strict Ephemeral | 'Public Link' only works for current session lifetime. | |
| Read-only Snapshots | Save a read-only snapshot to a 'public' table for sharing. | ✓ |
| User Accounts (Wait) | Time to add user accounts (Phase 4 scope creep?). | |

**User's choice:** Read-only Snapshots
**Notes:** Provides a way to support public sharing without the complexity of a full authentication system yet.

---

## Claude's Discretion

- Selection of specific data sets for national averages.
- Exact implementation of the "Hybrid" Recharts + Organic SVG styling.

## Deferred Ideas

- **Hyper-personalized Action Calculations:** Noted for potential Phase 4/5 refinement if more detailed carbon factor datasets are integrated.

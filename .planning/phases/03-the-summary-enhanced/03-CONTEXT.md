# Phase 3: The Summary, Enhanced - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Enhance the output and reporting capabilities of the Calm platform. This involves deepening the personalized carbon summary ("The Edition") with detailed insights, comparative data (benchmarks), and calm, high-quality visualizations. The phase also introduces sharing capabilities (Image/PDF, Social Cards, Public Links) supported by read-only snapshots for persistence.

</domain>

<decisions>
## Implementation Decisions

### Visualization Strategy
- **D-24:** **Hybrid Visualization.** Use Recharts for data accuracy and structural layout, but skin or supplement them with **Custom Organic SVGs** (hand-drawn/rough edges) to maintain the "Calm" and "Organic" aesthetic established in earlier phases.

### Benchmarks & Comparison
- **D-25:** **Toggleable Benchmarks.** Allow users to switch between comparing their footprint against their **National Average** (requires country-level datasets) or a **Global Average**.

### Sharing & Persistence
- **D-26:** **Multi-format Sharing.** Support all three requested formats:
    - **Download as Image/PDF:** For private, local storage.
    - **Social Share Cards:** Optimized for Twitter/LinkedIn with key summary stats.
    - **Public Link:** A unique URL for the report.
- **D-27:** **Read-only Snapshots.** To support "Public Links" without full user accounts, implement a mechanism to save a static, read-only snapshot of the report data to the database. These snapshots are accessible via UUID and do not require authentication to view.

### Insights & Recommendations
- **D-28:** **Hybrid Insights Engine.** Use a rule-based logic for consistent, reliable category-level analysis, supplemented by **Gemini 1.5** to provide conversational "flavor" and personalized summary text.
- **D-29:** **Generic Category Advice.** Keep "Top 3 Actions" as helpful, category-level advice (e.g., "Eat more plant-based") rather than hyper-specific calculations, maintaining a low-friction, "Calm" user experience for this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase 3 deliverables and goals.
- `.planning/PRODUCT.md` — Brand personality and "Organic" design principles.
- `.planning/UI-SPEC.md` — Visual foundations (colors, spacing, typography).

### Prior Context
- `.planning/phases/01-the-foundation-the-interview-mvp/01-CONTEXT.md` — Core interview flow and Edition layout decisions.
- `.planning/phases/02-the-ledger/02-CONTEXT.md` — Ledger integration and session-linked data patterns.

### Existing Code
- `frontend/src/app/edition/[sessionId]/page.tsx` — Current summary page implementation (uses `html-to-image`).
- `backend/app/api/edition.py` — Current Edition API logic and footprint calculation.
- `frontend/src/components/OrganicDoodles.tsx` — Nature-inspired SVG components for custom visualizations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/OrganicDoodles.tsx`: Essential for adding "organic" styling to Recharts components.
- `toPng` (from `html-to-image`) in the current SummaryPage: Already set up for image export, can be extended for Social Share Cards.

### Established Patterns
- **Session-based state:** Currently stored in `app.services.ai_coach.session_states`. "Read-only Snapshots" will need to bridge this ephemeral state into a more persistent database record.
- **FastAPI routers:** New endpoints for sharing and snapshot retrieval should follow the pattern in `app.api.edition`.

### Integration Points
- **Database:** New schema needed for `snapshots` linked to `sessions`.
- **Frontend Edition Page:** Needs a "Comparison" toggle and new visualization components.

</code_context>

<specifics>
## Specific Ideas

- The user specifically requested a combination of Recharts (for structure) and Custom Organic SVGs (for flavor). This "Hybrid" aesthetic is a key technical requirement for the UI.

</specifics>

<deferred>
## Deferred Ideas

- **Hyper-specific Action Calculations:** Deferred in favor of generic category advice to maintain "Calm" philosophy and reduce dev effort for this phase.

</deferred>

---

*Phase: 3-The Summary, Enhanced*
*Context gathered: 2026-06-18*

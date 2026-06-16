# Phase 1: The Foundation & The Interview (MVP) - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Build and launch the core conversational carbon interview experience: a Next.js frontend with vintage broadsheet aesthetic (landing → chat interview → personalized newspaper output), a Python FastAPI backend with Gemini AI integration, a simple carbon calculation model, and PostgreSQL schema for ephemeral sessions.

</domain>

<decisions>
## Implementation Decisions

### Conversation Flow Control
- **D-01:** Backend state machine defines the question sequence and expected answer types; Gemini wraps each question in conversational language and adapts tone. State machine ensures coverage of all categories.
- **D-02:** Conditional branching — answers unlock follow-up questions (e.g., skipping flight questions if user doesn't travel by air).
- **D-03:** 5 categories: Commute, Travel, Home Energy, Diet, Shopping & Consumption.
- **D-04:** 20-25 questions total (4-5 per category) for a thorough but not overwhelming interview (~10 min).

### Chat Input Design
- **D-05:** Typewriter-styled input to match the broadsheet aesthetic.
- **D-06:** Hybrid input — free text always available, plus suggested quick-answer buttons for quantitative questions (range selectors like "0-5mi", "5-20mi", "20+").
- **D-07:** Scrollable chat history — all Q&A pairs remain visible.
- **D-08:** AI output uses typewriter/streaming effect (Gemini streams tokens character-by-character).

### Carbon Calculation Model
- **D-09:** Hybrid approach: Gemini returns structured JSON payload alongside conversational text (extracted numbers, categories), Python service computes footprint using hardcoded category-level average coefficients.
- **D-10:** Category-level average coefficients (better UX, fewer questions, matches MVP constraint of "estimate to engage the user").
- **D-11:** TODO: Validate coefficient choices against standard carbon factor databases during implementation.

### Edition Page Rendering
- **D-12:** React client-side component — backend returns JSON, frontend renders the broadsheet layout.
- **D-13:** Dynamic route: `/edition/[sessionId]`.
- **D-14:** Both print-friendly CSS (Cmd+P → PDF) and image export (html-to-image or similar).
- **D-15:** Content: bold personalized headline, total footprint, per-category breakdown with comparison bars, 1-2 pull quotes from user answers, top 3 actions, full Q&A transcript.

### the agent's Discretion
- Carbon coefficient detail level: agent chose category-level averages as better for UX. User requested this be added to TODO for implementation validation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase breakdown and high-level deliverables for Phase 1
- `.planning/REQUIREMENTS.md` — Detailed MVP user flow, technical requirements, design constraints
- `.planning/PROJECT.md` — Product vision and core features
- `.planning/config.json` — Tech stack configuration (Next.js, Python, PostgreSQL, Gemini)

### Existing Code
- `frontend/package.json` — Current frontend dependencies (Next.js 16.2.9, shadcn, Tailwind v4)
- `frontend/components.json` — shadcn registry configuration
- `backend/app/main.py` — FastAPI app scaffold with CORS
- `backend/app/api/interview.py` — Existing API router (health endpoint)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/ui/button.tsx` — shadcn button component (may adapt for quick-answer buttons)
- `frontend/src/app/layout.tsx` — Root layout with font configuration (currently Geist, will need broadsheet fonts)
- `backend/app/main.py` — FastAPI scaffold with CORS configured for localhost:3000

### Established Patterns
- Tailwind CSS v4 for styling (current setup)
- shadcn/radix-nova component style
- Next.js App Router

### Integration Points
- Frontend chat UI will POST to backend `/api/interview/*`
- Backend will call Gemini API (needs API key configuration)
- PostgreSQL connection needed for session storage
- Edition page will read from backend `/api/edition/[sessionId]`

</code_context>

<specifics>
## Specific Ideas

No specific design references provided — open to standard approaches adhering to the Vintage Broadsheet aesthetic (serif typography, monochrome `#FDFCF7`/`#1A1A1A`, column-based layout).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-The Foundation & The Interview (MVP)*
*Context gathered: 2026-06-17*

# Phase 4: Social & Sharing - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Add social features to the Calm platform: daily carbon tracking with streak visualization, newspaper-exact broadsheet export layout, and multi-format social sharing. This phase introduces Firebase Auth for minimal user accounts (breaking the no-accounts pattern to enable cross-device sync), implements GitHub-style contribution tracking with crayon-drawn aesthetic, and creates true broadsheet dimensions for exports.

</domain>

<decisions>
## Implementation Decisions

### Persistence Strategy
- **D-30:** **Firebase Auth integration.** Break the "no user accounts" principle from Phases 1-3 to enable cross-device sync for daily tracking.
- **D-31:** **Email-only signup.** Minimal authentication - just email/password, no profile data or social login complexity.
- **D-32:** **Cross-device streak sync.** Daily entries and streak data sync across devices via Firebase user authentication.

### Streak Tracking Interface
- **D-33:** **GitHub-style contribution graph.** Calendar grid layout showing daily carbon entries with color intensity.
- **D-34:** **Crayon-drawn aesthetic.** Hand-drawn squares with organic, sketchy borders using the existing OrganicDoodles component style.
- **D-35:** **Color intensity mapping.** Green squares with varying intensity based on daily carbon consciousness/activity level.

### Daily Input Method
- **D-36:** **Hybrid user choice.** Users can choose between quick daily form or full ledger photo upload.
- **D-37:** **Quick daily form: 6-7 questions.** Streamlined version covering key categories (transport, meals, energy, etc.) for 30-second daily entries.
- **D-38:** **Ledger integration option.** Existing photo upload + Gemini processing available as alternative to form input.

### Newspaper Export Layout
- **D-39:** **True broadsheet dimensions.** Actual newspaper proportions (11"x17") replacing current edition layout.
- **D-40:** **Multiple column layout.** Traditional newspaper typography and column structure.
- **D-41:** **Newspaper masthead and typography.** Professional newspaper design elements while maintaining Calm's aesthetic.

### Social Format Optimization
- **D-42:** **Universal social images.** Single format (1200x630) optimized to work across LinkedIn/Twitter/Facebook platforms.
- **D-43:** **Key stats highlight.** Carbon footprint totals, top categories, and streak information prominent in social cards.
- **D-44:** **Calm branding consistency.** Social images maintain organic aesthetic and brand colors.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase 4 deliverables and dependencies
- `.planning/REQUIREMENTS.md` — Original MVP requirements (note: auth requirement change)
- `.planning/PROJECT.md` — Core product vision and aesthetic principles

### Prior Context
- `.planning/phases/01-the-foundation-the-interview-mvp/01-CONTEXT.md` — Interview flow and edition layout decisions
- `.planning/phases/02-the-ledger/02-CONTEXT.md` — Ledger integration patterns (now extended to daily input)  
- `.planning/phases/03-the-summary-enhanced/03-CONTEXT.md` — Sharing infrastructure and snapshot patterns

### Existing Code
- `frontend/src/app/share/[snapshotId]/page.tsx` — Current sharing page implementation (foundation for social cards)
- `frontend/src/components/OrganicDoodles.tsx` — Essential for crayon-drawn contribution graph styling
- `frontend/src/components/charts/OrganicBar.tsx` — Existing chart patterns to extend for streak visualization
- `backend/app/models/session.py` — Current session model (needs extension for user association)
- `backend/app/models/snapshot.py` — Sharing snapshot patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OrganicDoodles.tsx` — Critical for implementing crayon-drawn contribution graph squares
- `OrganicBarChart` component — Pattern for organic-styled data visualization to adapt for streaks
- Existing sharing infrastructure at `/share/[snapshotId]` — Foundation for universal social image generation
- `html-to-image` library — Already used for image export, can be extended for social cards

### Established Patterns
- **Session-based state:** Currently ephemeral, needs Firebase user association
- **Organic aesthetic:** Soft, sketchy, nature-inspired styling throughout
- **Multi-format export:** HTML → image pipeline established in Phase 3

### Integration Points
- **Database:** Session and Snapshot models need Firebase UID associations
- **Frontend:** New daily tracking UI components needed
- **Backend:** Firebase Admin SDK integration for user management
- **Export system:** Broadsheet layout generation and social card optimization

</code_context>

<specifics>
## Specific Ideas

- **Crayon contribution graph:** User specifically requested GitHub-style grid with hand-drawn, sketchy aesthetic matching Calm's organic design language
- **True broadsheet:** 11"x17" actual newspaper dimensions with traditional column layout, not just broadsheet-inspired design
- **6-7 question daily form:** Specific count for quick daily carbon tracking (vs 20-25 in full interview)

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
- **Implement sessionStorage interview persistence with redesigned edition dialog** (frontend) — Deferred as it's foundational persistence, not directly related to social sharing features. Belongs in a future maintenance phase.

</deferred>

---

*Phase: 04-social-sharing*
*Context gathered: 2026-06-19*
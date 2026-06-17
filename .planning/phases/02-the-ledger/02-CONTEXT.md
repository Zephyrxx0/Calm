# Phase 2: The Ledger - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the ephemeral interview experience with "The Ledger": a session-based automated data ingestion tool. Users can upload images (receipts) or documents (utility bills) which are processed by Gemini 1.5 to extract carbon-relevant data. This data is added to a "Ledger" view and used to update the session's total carbon footprint estimate.

</domain>

<decisions>
## Implementation Decisions

### Authentication & Persistence
- **D-16:** **No Authentication.** User accounts and permanent data persistence are out of scope for Phase 2.
- **D-17:** **Ephemeral Sessions.** The Ledger data will be linked to the Phase 1 session UUID and stored only for the duration of that session (PostgreSQL or local state). Data is lost once the session is cleared.

### Data Ingestion (OCR)
- **D-18:** **Gemini 1.5 Pro/Flash.** Use the existing AI provider for receipt and bill scanning to keep the tech stack unified.
- **D-19:** **Multi-format support.** Support image uploads (JPG/PNG) for receipts and PDF uploads for utility bills.

### Ledger UI & Aesthetic
- **D-20:** **Organic Style.** Consistent with `PRODUCT.md`. Use the `OrganicDoodles.tsx` components, soft transitions, and earthy tones (sage green, warm off-white).
- **D-21:** **"Tending a Garden" Metaphor.** The Ledger should not look like a rigid financial spreadsheet. It should feel like a peaceful collection of entries, perhaps with organic shapes or doodle-styled row dividers.
- **D-22:** **Dynamic Summary Update.** As items are added to the Ledger, the session's carbon footprint total and category breakdown should update in real-time.

### User Flow
- **D-23:** **Session-linked.** The Ledger is an extension of "The Interview". A user starts an interview, and can then transition to the Ledger to refine their footprint with hard data from receipts/bills.

</decisions>

<canonical_refs>
## Canonical References

### Project Planning
- `.planning/ROADMAP.md` — Phase breakdown (Note: Auth/Persistence removed per user directive)
- `.planning/PRODUCT.md` — Brand personality and "Organic" design principles
- `.planning/UI-SPEC.md` — Visual foundations (colors, spacing, typography)

### Existing Code
- `frontend/src/components/OrganicDoodles.tsx` — Nature-inspired SVG components
- `backend/app/models/session.py` — Existing session/message database models
- `backend/app/api/interview.py` — Current API structure

</canonical_refs>

<deferred>
## Deferred Ideas

- **User Accounts & Persistence:** Explicitly deferred/removed per user directive ("No need for persistant data, no auth").
- **Scientific Accuracy:** Still using high-level carbon factor estimates (maintained from Phase 1).

</deferred>

---

*Phase: 2-The Ledger*
*Context gathered: 2026-06-17*

# Project Roadmap: Calm

This document outlines the high-level development phases for the Calm project.

## Phase 1: The Foundation & The Interview (MVP)

*   **Objective:** Build and launch the core conversational experience.
*   **Requirements:** [Tech-Spike, Design-System, AI-Coach, Carbon-Model, Frontend]
*   **Key deliverables:**
    *   **Tech Spike:** Setup Next.js, Python, and PostgreSQL infrastructure.
    *   **Design System:** Implement the calm, cozy design language (soft colors, rounded corners, minimal).
    *   **AI Coach:** Develop the conversational backend service with Google Cloud AI integration.
    *   **Carbon Model:** Implement a simple carbon calculation model.
    *   **Frontend:** Build the chat interface and the dynamic summary output page.
*   **Goal:** A functional MVP that allows a user to complete the carbon interview and receive their personalized carbon summary.

**Plans:** 4 plans
Plans:

- [ ] 01-01-PLAN.md — Tech Spike: Setup DB and core SQLAlchemy models
- [ ] 01-02-PLAN.md — Design System: Typography, colors, and Landing Page
- [ ] 01-03-PLAN.md — AI Coach Backend: Gemini integration and Carbon Model
- [ ] 01-04-PLAN.md — Frontend Implementation: Chat UI and Edition layout

## Phase 2: The Ledger

*   **Objective:** Add data ingestion capabilities.
*   **Requirements:** [OCR-Integration, Ledger-View, Profile-Update]
*   **Key deliverables:**
    *   Integration with an OCR service (e.g., using Claude as suggested or another service).
    *   A new "Ledger" view, styled as a financial column, to display itemized carbon entries.
    *   Ability for the system to update a user's carbon profile based on ledger entries.
    *   Introduce user accounts to persist data.
*   **Goal:** Extend the interview session with an organic ledger allowing users to upload receipts and bills for automated carbon data extraction and dynamic footprint recalculation.

**Plans:** 3 plansPlans:
**Wave 1**

- [x] 02-01-PLAN.md — Database Models & Ledger Backend Service

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — API Endpoints & Footprint Recalculation

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Frontend Ledger UI & Data Ingestion

## Phase 3: The Summary, Enhanced

*   **Objective:** Enhance the output and reporting.
*   **Requirements:** [DETAIL-SUMMARY, BENCHMARKS, VISUALIZATIONS, SHARING]
*   **Key deliverables:**
    *   More detailed breakdown and insights in the summary.
    *   Actionable recommendations and comparisons (e.g., vs. national average).
    *   Data visualizations with the calm design language.
    *   Sharing capabilities for the generated report.
*   **Goal:** Transform the summary into a high-value, shareable carbon edition with organic visualizations, personalized AI insights, and public read-only links.

**Plans:** 4 plansPlans:
**Wave 1**

- [x] 03-00-PLAN.md — Scaffolding: Dependencies and Test Files
- [x] 03-01-PLAN.md — Snapshot Persistence & Benchmarks

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Enhanced Visualization & Insights

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — Sharing, Export & Public Links

## Phase 4: Social & Sharing

*   **Objective:** Add social features — streaks, daily carbon tracking (git-like input), newspaper-exact export, and sharing across formats (JPEG/PNG, LinkedIn, links).
*   **Key deliverables:**
    *   Daily carbon tracker with streak tracking (similar to GitHub contribution graph).
    *   Newspaper-exact layout for edition export (actual broadsheet layout, not editorial style).
    *   Multi-format export: image (JPEG/PNG), LinkedIn text, shareable links.
    *   Storage and accounts: brainstorm device-local vs. account-based persistence.
*   **Goal:** Turn Calm into a daily habit with social accountability and shareable newspaper-quality reports.
*   **Depends on:** Phase 3

**Plans:** 4/4 plans complete

Plans:

- [x] TBD (run /gsd-plan-phase 4 to break down) (completed 2026-06-20)

### Phase 04.1: edition edits (INSERTED)

**Goal:** Transform the broadsheet edition into a realistic 2000-era vintage newspaper front page with 7-layer print simulation (paper grain, halftone, ink bleed, fold crease, edge wear, vignette, cream-to-ivory gradient) — all as inline SVG/CSS filters captured natively by html-to-image at 17×11 landscape. Single NewspaperLayout component serves three routes: edition, daily, and share.
**Requirements**: [D-45, D-46, D-47, D-48, D-49, D-50, D-51, D-52, D-53, D-54, D-55, D-56, D-57]
**Depends on:** Phase 4
**Plans:** 3/4 plans executed
Plans:
**Wave 1**

- [x] 04.1-01-PLAN.md — Font Setup & Masthead: Playfair Display + PT Serif via next/font/google, masthead "The Daily Calm"

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04.1-02-PLAN.md — SVG Filters & Visual Effects: 7-layer vintage print stack, 5-column layout, paper grain, ink bleed, fold crease, edge wear, vignette
- [x] 04.1-03-PLAN.md — Daily & Share Integration: Newspaper view toggle on daily page, newspaper rendering on share page

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 04.1-04-PLAN.md — Tests: NewspaperLayout component tests, update BroadsheetExport/DailyForm/SharePage tests

## Phase 5: Refinement & Growth

*   **Objective:** Broaden the platform's capabilities.
*   **Key deliverables:**
    *   Expanding the AI Coach's question set.
    *   Supporting more types of data for the Ledger.
    *   Community or comparative features.
*   **Goal:** Polish and extend existing features based on user feedback.
*   **Depends on:** Phase 4

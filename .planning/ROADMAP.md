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

**Plans:** 3 plans
Plans:

- [ ] 03-01-PLAN.md — Snapshot Persistence & Benchmarks
- [ ] 03-02-PLAN.md — Enhanced Visualization & Insights
- [ ] 03-03-PLAN.md — Sharing, Export & Public Links

## Phase 4: Refinement & Growth

*   **Objective:** Broaden the platform's capabilities.
*   **Key deliverables:**
    *   Expanding the AI Coach's question set.
    *   Supporting more types of data for the Ledger.
    *   Community or comparative features.

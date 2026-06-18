# Phase 03: The Summary, Enhanced - Validation Strategy

This document outlines the validation plan for Phase 03, ensuring that the enhanced reporting, benchmarking, and sharing features meet the requirements and maintain the "Calm" aesthetic.

## Test Frameworks

- **Frontend:** Vitest + React Testing Library (for UI and charting components)
- **Backend:** Pytest (for API endpoints, services, and snapshot persistence)

## Requirement Traceability

| Req ID | Requirement | Test File | Test Type |
|--------|-------------|-----------|-----------|
| DETAIL-SUMMARY | More detailed breakdown and insights in the summary | `frontend/tests/Summary.test.tsx` | UI / Integration |
| BENCHMARKS | Actionable recommendations and comparisons | `backend/tests/test_benchmarks.py` | Unit / Service |
| VISUALIZATIONS | Data visualizations with the calm design language | `frontend/tests/OrganicBar.test.tsx` | Component / Snapshot |
| SHARING | Sharing capabilities for the generated report | `backend/tests/test_snapshots.py` | API / Integration |
| SHARING | Public read-only links and social cards | `frontend/tests/SharePage.test.tsx` | UI / Integration |

## Validation Waves

### Wave 0: Scaffolding
- **Objective:** Create test file placeholders and install dependencies.
- **Verification:** `ls` checks and `pnpm install` success.

### Wave 1: Backend Infrastructure (Plan 01)
- **Objective:** Validate Snapshot model and Benchmark service.
- **Verification:**
  - `pytest backend/tests/test_snapshots.py` (model/API)
  - `pytest backend/tests/test_benchmarks.py` (service)

### Wave 2: Enhanced UI & Insights (Plan 02)
- **Objective:** Validate organic charts, AI insights, and summary page updates.
- **Verification:**
  - `npm run test -- frontend/tests/OrganicBar.test.tsx`
  - `npm run test -- frontend/tests/Summary.test.tsx`
  - `pytest backend/tests/test_api_edition.py`

### Wave 3: Sharing & Export (Plan 03)
- **Objective:** Validate public share page, OG cards, and PDF/Image export.
- **Verification:**
  - `npm run test -- frontend/tests/SharePage.test.tsx`
  - Manual verification of PDF/Image downloads and public link accessibility.

## Aesthetic & UX Validation (Human Checkpoints)

| Checkpoint | Goal | Criteria |
|------------|------|----------|
| Organic Charts | Confirm "hand-drawn" feel | Bars should have non-straight edges; colors must match UI-SPEC.md. |
| AI Insights | Verify "Calm Journalist" tone | Text should be informative but not alarmist; 2-3 sentences. |
| Share Card | Check social preview quality | Stats should be legible; branding must be clear. |
| PDF Export | Verify font fidelity | Exported PDF must use brand fonts (no fallback serif/sans). |

## Security & Privacy Checks

- [ ] **UUID Leakage:** Verify snapshots use v4 UUIDs (not sequential).
- [ ] **PII Removal:** Ensure no PII is sent to Gemini for insights.
- [ ] **Rate Limiting:** (Optional/Future) Consider OG image generation caching.

---
phase: 01-the-foundation-the-interview-mvp
plan: 03
subsystem: api
tags: [gemini, google-genai, carbon-model, sse, vercel-ai-sdk, fastapi, tdd]

# Dependency graph
requires:
  - phase: 01-01
    provides: async SQLAlchemy session, Session/Message models, POST /interview/start
provides:
  - CarbonModel service with validated coefficients across 5 categories
  - AICoach state machine with Gemini integration and 25-question cap
  - POST /api/interview/{session_id}/message SSE streaming endpoint
  - GET /api/edition/{session_id} footprint and edition data endpoint
affects: [01-04]

# Tech tracking
tech-stack:
  added: [google-genai, carbon-model-coefficients]
  patterns: [tdd-red-green-cycle, sse-streaming, vercel-ai-sdk-data-stream-protocol, state-machine-interview]

key-files:
  created:
    - backend/app/services/carbon_model.py
    - backend/app/services/ai_coach.py
    - backend/app/api/edition.py
    - backend/tests/test_carbon_model.py
    - backend/tests/test_ai_coach.py
    - backend/tests/test_api_endpoints.py
  modified:
    - backend/app/api/interview.py
    - backend/app/main.py

key-decisions:
  - "Used google-genai SDK (not google-generativeai) — already in requirements.txt as the unified Google Gen AI client"
  - "Session state stored in-memory dict (session_states) — ephemeral MVP, no Redis needed"
  - "SSE streaming uses Vercel AI SDK Data Stream Protocol (0:\"text\", d marker) for frontend compatibility"
  - "Carbon coefficients sourced from DEFRA 2023, ICAO, BEIS, Poore & Nemecek 2018, EU HH data — documented inline (D-11)"
  - "Pull quotes extracted via longest-user-message heuristic — simple MVP approach"
  - "Input length validation (2000 chars) per threat model T-01-03 tampering mitigation"

patterns-established:
  - "TDD RED-GREEN per task: failing tests committed first, then minimal implementation"
  - "SSE endpoint pattern: StreamingResponse with async generator, text/event-stream content type"
  - "AI Coach abstraction: _call_gemini method separated for test mocking"
  - "Shared session_states dict in ai_coach module for cross-endpoint access"

requirements-completed: [AI-Coach, Carbon-Model]

# Metrics
duration: 7min
completed: 2026-06-17
---

# Phase 1 Plan 03: AI Coach Backend Summary

**Gemini-powered state machine with 5-category interview flow, carbon calculation model with validated coefficients, and SSE streaming endpoints compliant with Vercel AI SDK Data Stream Protocol**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-17T05:35:57Z
- **Completed:** 2026-06-17T05:43:42Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Carbon calculation model with hardcoded coefficients from 5 validated sources (DEFRA, ICAO, BEIS, Poore & Nemecek, EU HH)
- Gemini state machine controlling 5-category interview flow with 25-question cap, structured JSON output, and prompt injection defense
- Chat SSE endpoint streaming via Vercel AI SDK Data Stream Protocol (0:"text" format)
- Edition endpoint computing real-time footprint from extracted interview data with pull quote extraction

## Task Commits

Each task was committed atomically via TDD RED-GREEN cycle:

1. **Task 1: Carbon Calculation Model**
   - `6be2dfe` (test) — RED: 8 failing tests for calculation and breakdown
   - `040eacb` (feat) — GREEN: CarbonModel with 5-category coefficients
2. **Task 2: Gemini State Machine**
   - `a6c14da` (test) — RED: 9 failing tests for greeting, transitions, format
   - `963b029` (feat) — GREEN: AICoach with InterviewState, category cycling, JSON parsing
3. **Task 3: API Endpoints (Chat & Edition)**
   - `deb57ec` (test) — RED: 8 failing tests for SSE streaming and edition data
   - `e5cde2b` (feat) — GREEN: POST /message SSE + GET /edition endpoints

## Files Created/Modified
- `backend/app/services/carbon_model.py` — CarbonModel with validated coefficients (DEFRA, ICAO, BEIS, Poore & Nemecek 2018, EU HH)
- `backend/app/services/ai_coach.py` — AICoach state machine, InterviewState, session_states store, Gemini integration
- `backend/app/api/interview.py` — Added POST /message SSE endpoint with Vercel AI SDK protocol
- `backend/app/api/edition.py` — GET /edition endpoint with footprint computation and pull quotes
- `backend/app/main.py` — Registered edition router
- `backend/tests/test_carbon_model.py` — 8 tests: calculation, breakdown, edge cases
- `backend/tests/test_ai_coach.py` — 9 tests: greeting, transitions, completion, format
- `backend/tests/test_api_endpoints.py` — 8 tests: SSE streaming, edition data, 404 handling

## Decisions Made
- Used `google-genai` SDK (already in requirements.txt) instead of `google-generativeai` — unified Google Gen AI client with `Client.models.generate_content()` API
- Session state stored in module-level `session_states` dict — ephemeral MVP, avoids Redis dependency
- SSE uses Vercel AI SDK Data Stream Protocol (`0:"text"` chunks, `d` done marker) — enables direct frontend integration with Vercel AI SDK `useChat`
- Carbon coefficients documented inline with source attribution (D-11 validation requirement)
- Pull quotes use longest-user-message heuristic — simple, effective for MVP

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed state machine reset on partially-initialized state**
- **Found during:** Task 2 GREEN (AI Coach implementation)
- **Issue:** `_advance_state` reset `questions_asked` to 1 when `current_category` was None, even if questions had already been counted
- **Fix:** Added guard `state.questions_asked == 0` to first-call branch; separate fallback for partial initialization
- **Files modified:** backend/app/services/ai_coach.py
- **Verification:** All 9 ai_coach tests pass including the max-questions completion test
- **Committed in:** 963b029 (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix necessary for correct state machine behavior. No scope creep.

## Issues Encountered
None

## User Setup Required

**Google Cloud AI requires API key configuration.** See plan frontmatter:
- **Service:** Google Cloud AI (Gemini)
- **Env var:** `GEMINI_API_KEY`
- **Source:** Google AI Studio (https://aistudio.google.com/apikey)
- **Verification:** Set the env var, start the backend, POST to /api/interview/start then /message — AI response should stream back

## Next Phase Readiness
- AI Coach backend complete: state machine, carbon model, and streaming endpoints operational
- 33 tests passing across all backend modules (database, models, carbon model, AI coach, API endpoints)
- Ready for frontend chat UI integration (Plan 04) — POST /message SSE and GET /edition endpoints available
- GEMINI_API_KEY must be configured for live AI responses (fallback returns placeholder text without key)

---
*Phase: 01-the-foundation-the-interview-mvp*
*Completed: 2026-06-17*

## Self-Check: PASSED

- All 7 key files exist on disk
- All 6 commits found in git log (6be2dfe, 040eacb, a6c14da, 963b029, deb57ec, e5cde2b)
- All 33 tests passing (8 carbon model + 9 AI coach + 8 API endpoints + 6 database + 2 interview API)

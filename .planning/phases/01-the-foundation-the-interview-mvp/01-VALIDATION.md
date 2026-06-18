---
phase: 01
slug: the-foundation-the-interview-mvp
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Backend Framework** | pytest 8.x + pytest-asyncio |
| **Frontend Framework** | vitest + @testing-library/react |
| **Backend config** | `backend/pyproject.toml` (implied) |
| **Frontend config** | `frontend/vitest.config.ts` |
| **Backend quick run** | `cd backend && pytest tests/test_database.py tests/test_carbon_model.py tests/test_ai_coach.py -q` |
| **Backend full suite** | `cd backend && pytest tests/ -q` |
| **Frontend quick run** | `cd frontend && npx vitest run` |
| **Estimated runtime** | ~8s backend, ~1s frontend |

---

## Sampling Rate

- **After every task commit:** Run relevant test file
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Status |
|---------|------|------|-------------|--------|
| 01-01-01 | 01 | 1 | Tech-Spike (DB models) | ✅ green |
| 01-01-02 | 01 | 1 | Tech-Spike (start endpoint) | ❌ red |
| 01-02-01 | 02 | 1 | Design-System (typography) | ⚠ manual |
| 01-02-02 | 02 | 1 | Design-System (landing) | ✅ green |
| 01-03-01 | 03 | 2 | Carbon-Model | ✅ green |
| 01-03-02 | 03 | 2 | AI-Coach | ✅ green |
| 01-03-03 | 03 | 2 | AI-Coach (chat/edition endpoints) | ❌ red |
| 01-04-01 | 04 | 3 | Frontend (Chat UI) | ❌ red |
| 01-04-02 | 04 | 3 | Frontend (Edition) | ⚠ manual |
| 01-04-03 | 04 | 3 | Frontend (E2E) | ⚠ manual |

*Status: ✅ green · ❌ red · ⚠️ flaky/manual*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_api_interview.py` — fix MissingGreenlet (use httpx.AsyncClient)
- [ ] `backend/tests/test_api_endpoints.py` — fix MissingGreenlet (use httpx.AsyncClient, add AI coach mock)
- [ ] `frontend/tests/ChatInterface.test.tsx` — update for redesigned ChatInterface (manual SSE parsing)
- [ ] `frontend/tests/edition.test.tsx` — add edition page test

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Broadsheet typography renders correctly | Design-System | Visual, no automated visual regression | Open landing page, verify serif headings, monochrome palette, responsive layout |
| Edition page renders and exports | Frontend | Requires live backend + Gemini API | Navigate to /edition/[id], verify footprint, breakdown, pull quotes. Test print + image export |
| E2E interview flow | Frontend | Requires live backend + Gemini API | Click "Begin Your Interview", complete conversation, verify edition output |

---

## Failure Details

### ❌ test_api_interview.py (2 failures)
**Root cause:** `MissingGreenlet` — test uses sync `fastapi.testclient.TestClient` but app now uses async SQLAlchemy sessions.  
**Fix:** Switch tests to `httpx.AsyncClient` with `pytest-asyncio`.

### ❌ test_api_endpoints.py (6 errors)
**Root cause:** Same `MissingGreenlet` issue plus missing AI coach mock in test fixtures.  
**Fix:** Switch to `httpx.AsyncClient`, add `AICoach` mock via `app.dependency_overrides`.

### ❌ ChatInterface.test.tsx (2 failures)
**Root cause:** Test expects `@ai-sdk/react` useChat hook, but component was rewritten to use manual fetch + SSE parsing.  
**Fix:** Update test to mock `fetch` and verify manual SSE stream parsing.

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

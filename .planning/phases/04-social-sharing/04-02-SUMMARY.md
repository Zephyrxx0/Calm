---
phase: 04-social-sharing
plan: 02
subsystem: api
tags: [fastapi, firebase-auth, sqlalchemy, streak-tracking, pytest]

# Dependency graph
requires:
  - phase: 04-01
    provides: "Firebase Auth SDK integration, User model, DailyEntry model, SignInModal component"
provides:
  - "Daily tracking API with authenticated CRUD for carbon entries"
  - "Server-side streak calculation and 365-day contribution graph"
  - "One-entry-per-day enforcement via DB constraint and API validation"
affects: ["04-03", "04-04"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Firebase Bearer token extraction via FastAPI Header dependency"
    - "Server-side streak calculation with consecutive-day counting"
    - "Carbon consciousness auto-calculation heuristic from transport/meals/energy inputs"
    - "AsyncMock + patch pattern for Firebase auth in integration tests"

key-files:
  created:
    - "backend/app/api/daily.py"
    - "backend/tests/test_daily_api.py"
  modified:
    - "backend/app/main.py"
    - "backend/app/models/__init__.py"

key-decisions:
  - "Daily router carries its own /api/daily prefix rather than relying on main.py prefix chaining"
  - "Carbon consciousness auto-calculated from transport_mode, meals_count, energy_usage when not explicitly provided"
  - "Contribution graph intensity maps consciousness 1-5 → 0-4 (caps at 4 for heatmap display)"
  - "Current streak counts consecutive days ending today (not yesterday) for real-time feel"
  - "Model __init__.py converted to relative imports for consistency across the models package"

requirements-completed: []

# Metrics
duration: 3 min
completed: 2026-06-20
---

# Phase 4 Plan 2: Daily Tracking API Summary

**Backend API for daily carbon tracking with Firebase auth, server-side streak calculation, and 365-day contribution graph data — 3 endpoints, 7 integration tests, 11 total passing tests with zero regressions.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-20T14:39:18Z
- **Completed:** 2026-06-20T14:42:46Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Daily carbon entry creation with Firebase token auth and one-per-day constraint enforcement
- Server-side streak calculation: current streak, longest streak, and total tracked days
- 365-day contribution graph data with intensity mapping for heatmap visualization
- Comprehensive test suite (7 tests) validating auth, duplicate prevention, streak logic, and data retrieval
- All existing ledger tests continue to pass — zero regressions introduced

## Task Commits

Each task was committed atomically:

1. **Task 1: Daily Tracking API Endpoints** - `0a89db4` (feat)
2. **Task 2: Register Daily Router and Update Models Init** - `d7f01ff` (feat)
3. **Task 3: Daily API Tests** - `b0820d6` (test)

## Files Created/Modified

- `backend/app/api/daily.py` — Daily tracking API with 3 endpoints (POST /api/daily, GET /api/daily/streak, GET /api/daily/entries)
- `backend/app/main.py` — Registered daily_router in FastAPI app
- `backend/app/models/__init__.py` — Converted to relative imports, ensured User and DailyEntry are exported
- `backend/tests/test_daily_api.py` — 7 integration tests covering auth, duplicate prevention, streak calculation, and data retrieval

## Decisions Made

- Daily router uses its own `/api/daily` prefix; registered without extra prefix in main.py to avoid `/api/api/daily` double-prefixing
- Carbon consciousness auto-calculation heuristic: starts at neutral (3), adjusts ±1 based on transport_mode, meals_count, energy_usage — clamped to 1-5
- Contribution graph intensity: `min(carbon_consciousness, 4)` — maps consciousness 1→1, 5→4, no-entry→0
- Current streak counts consecutive days ending today (inclusive) for immediate feedback
- Model imports standardized to relative form (`from .session import ...`) across the entire models package
- Test auth mocking uses `patch("app.api.daily.verify_firebase_token")` with `AsyncMock` — clean, follows existing ledger test patterns

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tests needed Authorization header to pass FastAPI validation**
- **Found during:** Task 3 (Daily API Tests)
- **Issue:** All 7 tests returned 422 because `_get_current_user` dependency requires `Header(...)` which FastAPI validates before the dependency function runs. Mocking `verify_firebase_token` alone was insufficient.
- **Fix:** Added `headers={"Authorization": "Bearer fake-test-token"}` to all HTTP requests; the mock still controls whether the token is accepted or rejected.
- **Files modified:** `backend/tests/test_daily_api.py`
- **Verification:** All 7 tests pass after fix
- **Committed in:** `b0820d6` (Task 3 commit)

**2. [Rule 1 - Bug] Streak test assertion was incorrect**
- **Found during:** Task 3 (Daily API Tests)
- **Issue:** `test_get_streak_data_with_entries` asserted `current_streak == 1`, but 5 consecutive entries ending today yield `current_streak == 5`.
- **Fix:** Corrected assertion to `assert data["current_streak"] == 5`.
- **Files modified:** `backend/tests/test_daily_api.py`
- **Verification:** Test passes after fix
- **Committed in:** `b0820d6` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes were minor test corrections. No production code changes needed. Zero scope creep.

## Issues Encountered

None — all planned work completed smoothly. The 422 issue was a typical FastAPI test setup nuance resolved in one fix cycle.

## User Setup Required

None — no external service configuration required. Firebase Admin SDK was already configured in Phase 04-01.

## Next Phase Readiness

- Daily tracking API is complete and tested — ready for frontend integration in Plan 04-03 (Streak UI & Contribution Graph)
- All endpoints are authenticated via Firebase Bearer tokens
- Streak data and contribution graph data are computed server-side, tamper-resistant
- Plan 04-03 can consume the `/api/daily/streak` and `/api/daily/entries` endpoints directly

---

*Phase: 04-social-sharing*
*Completed: 2026-06-20*

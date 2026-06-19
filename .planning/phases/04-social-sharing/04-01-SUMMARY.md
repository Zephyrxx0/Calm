---
phase: 04-social-sharing
plan: 01
subsystem: auth
tags: [firebase, firebase-admin, sqlalchemy, fastapi, nextjs, auth-context]

# Dependency graph
requires:
  - phase: 01-the-foundation-the-interview-mvp
    provides: Backend database layer (SQLAlchemy Base, async engine)
provides:
  - Firebase Admin SDK token verification on backend
  - Firebase client SDK auth context provider on frontend
  - User model with Firebase UID primary key
  - DailyEntry model with one-entry-per-day unique constraint
affects: [daily-tracking, streak-visualization, social-sharing]

# Tech tracking
tech-stack:
  added: [firebase-admin>=6.5.0, firebase@10.13.1, react-calendar-heatmap@1.9.0, date-fns@2.30.0]
  patterns: [Firebase client/server token verification, AuthContext provider pattern, SQLAlchemy model with composite unique constraint]

key-files:
  created:
    - backend/app/auth/__init__.py
    - backend/app/auth/firebase_auth.py
    - backend/app/models/user.py
    - backend/app/models/daily_entry.py
    - frontend/src/lib/firebase.ts
    - frontend/src/contexts/AuthContext.tsx
    - backend/tests/test_firebase_auth.py
  modified:
    - backend/requirements.txt
    - backend/app/models/__init__.py
    - frontend/package.json
    - .gitignore

key-decisions:
  - "Used FirebaseError (base exception) instead of non-existent auth.Error class for token verification error handling"
  - "ExpiredIdTokenError requires both message and cause arguments in firebase-admin v6+"
  - "Added !frontend/src/lib/ exception to .gitignore to unblock frontend source files from Python lib/ pattern"

patterns-established:
  - "Auth pattern: Firebase client SDK manages auth state on frontend, Admin SDK verifies tokens on backend"
  - "Model pattern: Firebase UID as primary key for User, foreign key on DailyEntry with unique constraint per user per day"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-06-19
---

# Phase 04 Plan 01: Firebase Auth Integration Summary

**Firebase Auth with email/password sign-in, server-side token verification via Firebase Admin SDK, and PostgreSQL models for user profiles and daily carbon tracking entries.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-19T18:00:00Z
- **Completed:** 2026-06-19T18:05:51Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Backend Firebase Admin SDK integration with async token verification endpoint
- User model (firebase_uid PK) and DailyEntry model (one-entry-per-day constraint)
- Frontend Firebase client SDK configured with AuthContext provider
- 4 passing tests covering valid, invalid, expired, and malformed token scenarios

## Task Commits

Each task was committed atomically:

1. **Task 1: Firebase Admin SDK Setup** - `4c13497` (feat)
2. **Task 2: Frontend Firebase Client Setup** - `112a6b4` (feat)
3. **Task 3: Backend Firebase Tests** - `6dc6d8a` (test)

## Files Created/Modified

- `backend/requirements.txt` - Added firebase-admin>=6.5.0
- `backend/app/auth/__init__.py` - Auth package init
- `backend/app/auth/firebase_auth.py` - Firebase Admin SDK init + verify_firebase_token()
- `backend/app/models/user.py` - User model with firebase_uid PK
- `backend/app/models/daily_entry.py` - DailyEntry model with unique constraint
- `backend/app/models/__init__.py` - Export new models
- `frontend/src/lib/firebase.ts` - Firebase client app initialization
- `frontend/src/contexts/AuthContext.tsx` - AuthContext provider with signIn/signUp/logOut
- `frontend/package.json` - Added firebase, react-calendar-heatmap, date-fns
- `backend/tests/test_firebase_auth.py` - 4 token verification tests
- `.gitignore` - Fixed Python lib/ pattern to not ignore frontend/src/lib/

## Decisions Made

- Used `FirebaseError` base exception instead of non-existent `firebase_admin.auth.Error` — the specific auth exceptions (InvalidIdTokenError, ExpiredIdTokenError) are subclasses but catching the base is simpler and covers all auth error cases
- `ExpiredIdTokenError` constructor requires both `message` and `cause` arguments in firebase-admin v6+, unlike `InvalidIdTokenError` which defaults `cause=None`
- Added `!frontend/src/lib/` negation to `.gitignore` — the Python `lib/` pattern was too broad and matched the Next.js source directory

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed firebase_admin.auth.Error import**
- **Found during:** Task 1 (firebase_auth.py creation)
- **Issue:** Plan specified `from firebase_admin.auth import Error` but this class doesn't exist in firebase-admin v6+
- **Fix:** Changed to `from firebase_admin.exceptions import FirebaseError` and caught that instead
- **Files modified:** backend/app/auth/firebase_auth.py
- **Verification:** Import succeeds, all 4 tests pass
- **Committed in:** 4c13497 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed .gitignore blocking frontend/src/lib/**
- **Found during:** Task 2 (staging frontend files)
- **Issue:** Python `lib/` pattern in .gitignore matched `frontend/src/lib/` directory
- **Fix:** Added `!frontend/src/lib/` negation pattern after `lib/`
- **Files modified:** .gitignore
- **Verification:** git add succeeds for frontend/src/lib/firebase.ts
- **Committed in:** 112a6b4 (Task 2 commit)

**3. [Rule 1 - Bug] Fixed ExpiredIdTokenError constructor signature**
- **Found during:** Task 3 (test execution)
- **Issue:** `ExpiredIdTokenError("message")` fails — requires `cause` argument
- **Fix:** Changed to `ExpiredIdTokenError("Token has expired", cause=ValueError("expired"))`
- **Files modified:** backend/tests/test_firebase_auth.py
- **Verification:** All 4 tests pass (4/4)
- **Committed in:** 6dc6d8a (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

- `firebase_admin.auth.Error` doesn't exist in v6+ — used `FirebaseError` base class instead
- `ExpiredIdTokenError` requires `cause` argument — updated test accordingly
- `.gitignore` Python `lib/` pattern too broad — added frontend exception

## User Setup Required

**Firebase project configuration needed before auth works:**
- Create Firebase project at console.firebase.google.com
- Enable Email/Password authentication in Firebase Console
- Set environment variables:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `FIREBASE_CREDENTIALS_PATH` (backend service account JSON)
- For local dev: `firebase emulators:start --only auth` and set `NEXT_PUBLIC_USE_AUTH_EMULATOR=true`

## Next Phase Readiness

- Firebase Auth foundation complete — backend verifies tokens, frontend manages auth state
- Database models ready for daily tracking CRUD endpoints
- Ready for: auth UI components (sign-in modal), daily entry API endpoints, contribution graph

## Self-Check: PASSED

- All 3 acceptance criteria sets verified (15/15 checks passed)
- All 4 tests pass (pytest -v)
- Import verification passes (models + firebase_auth)
- All created files exist on disk
- All commits present in git log

---

*Phase: 04-social-sharing*
*Completed: 2026-06-19*

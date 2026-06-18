---
phase: 02
slug: the-ledger
status: verified
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-18
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Backend Framework** | pytest 8.x + pytest-asyncio |
| **Frontend Framework** | vitest + @testing-library/react |
| **Backend config** | `backend/` |
| **Frontend config** | `frontend/vitest.config.ts` |
| **Backend run** | `cd backend && pytest tests/test_scanner.py tests/test_api_ledger.py -q` |
| **Frontend run** | `cd frontend && npx vitest run` |
| **Estimated runtime** | ~2s |

---

## Sampling Rate

- **After every task commit:** Run relevant test file
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Status |
|---------|------|------|-------------|--------|
| 02-01-01 | 01 | 1 | LedgerEntry model | ✅ green |
| 02-01-02 | 01 | 1 | scanner.py (Gemini extraction) | ✅ green |
| 02-01-03 | 01 | 1 | scanner.py (file cleanup) | ✅ green |
| 02-02-01 | 02 | 2 | POST /api/ledger/upload | ✅ green |
| 02-02-02 | 02 | 2 | GET /api/ledger/{session_id} | ✅ green |
| 02-02-03 | 02 | 2 | error handling (404) | ✅ green |
| 02-02-04 | 02 | 2 | footprint recalculation | ✅ green |
| 02-03-01 | 03 | 3 | FileUpload component | ✅ green |
| 02-03-02 | 03 | 3 | LedgerView component | ✅ green |
| 02-03-03 | 03 | 3 | LedgerPage | ✅ green |
| 02-03-04 | 03 | 3 | bidirectional nav | ✅ green |

*Status: ✅ green · ❌ red · ⚠️ flaky/manual*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No Wave 0 needed.

---

## Manual-Only Verifications

No manual-only verifications. All phase behaviors have automated test coverage.

---

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity maintained
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** verified 2026-06-18

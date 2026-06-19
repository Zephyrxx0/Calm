---
phase: 4
slug: social-sharing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-19
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (frontend), pytest 7.x (backend) |
| **Config file** | jest.config.js, pytest.ini |
| **Quick run command** | `npm test -- --passWithNoTests` |
| **Full suite command** | `npm test && cd backend && python -m pytest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --passWithNoTests`
- **After every plan wave:** Run `npm test && cd backend && python -m pytest`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/__tests__/social-sharing.test.tsx` — Firebase Auth integration tests
- [ ] `frontend/src/__tests__/contribution-graph.test.tsx` — streak tracking component tests  
- [ ] `backend/tests/test_daily_tracking.py` — daily entry API tests
- [ ] `backend/tests/test_broadsheet_export.py` — newspaper layout tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Firebase Auth UI flow | D-30 | OAuth provider integration | 1. Sign up with email 2. Verify cross-device sync 3. Check logout behavior |
| Broadsheet print layout | D-39 | CSS print media queries | 1. Generate edition 2. Print preview 3. Verify 11"x17" dimensions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
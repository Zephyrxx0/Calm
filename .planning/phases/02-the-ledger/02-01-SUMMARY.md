---
phase: 02-the-ledger
plan: 01
status: complete
started: 2026-06-18
completed: 2026-06-18
---

# Plan 02-01: Database Models & Ledger Backend Service

## What Was Built
- `LedgerEntry` SQLAlchemy model with FK to Session (cascade delete-orphan)
- Async `scan_receipt_or_bill` service using Gemini File API for carbon extraction
- Ephemeral file deletion enforced in `finally` block
- PDF polling until ACTIVE state before generation

## Key Files
- Modified: `backend/app/models/session.py` — added LedgerEntry model + relationship
- Modified: `backend/requirements.txt` — added python-multipart
- Created: `backend/app/services/scanner.py` — Gemini scanner service
- Created: `backend/tests/test_scanner.py` — 3 tests (extraction, cleanup on error, PDF polling)

## Self-Check: PASSED
- 11/11 tests pass (8 existing + 2 new model tests + 3 scanner tests)
- LedgerEntry correctly linked to Session via FK
- Scanner always deletes remote files (verified via error path test)

## Decisions Made
- Used `gemini-2.0-flash` model for cost-effective extraction
- JSON markdown fence stripping added for robustness
- Category constrained to: Energy, Transport, Food, Shopping

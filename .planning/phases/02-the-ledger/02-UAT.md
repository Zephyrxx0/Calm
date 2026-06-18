---
status: testing
phase: 02-the-ledger
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md
started: 2026-06-18T14:35:00Z
updated: 2026-06-18T14:35:00Z
---

## Current Test

number: 6
name: API Endpoints
expected: |
  POST /api/ledger/upload/{session_id} accepts file, returns recalculated totals. GET /api/ledger/{session_id} returns entries with total and breakdown.
testing complete

## Tests

### 1. Cold Start Smoke Test
expected: Backend and frontend boot cleanly. Backend ledger routes registered.
result: pass

### 2. Navigate to Ledger from Interview
expected: Navigate to /interview, start a session. See a "Refine in Ledger" link. Click it to go to /ledger/[sessionId].
result: pass

### 3. Upload a Receipt
expected: On ledger page, drag-and-drop or click to upload a receipt image (JPG/PNG) or PDF. File processes and a new entry appears with carbon category badge.
result: pass

### 4. View Ledger Entries
expected: After uploading, entries appear in list with category, date, and kg CO₂e. Total footprint updates. Category breakdown shows distribution.
result: pass

### 5. Navigate Back to Interview
expected: Click "Back to Interview" from ledger page. Returns to /interview with the same session.
result: pass

### 6. API Endpoints
expected: POST /api/ledger/upload/{session_id} accepts file, returns recalculated totals. GET /api/ledger/{session_id} returns entries with total and breakdown.
result: skipped
reason: "save to todo"

## Summary

total: 6
passed: 5
issues: 0
pending: 0
skipped: 1

## Gaps

[none yet]

---
status: testing
phase: 01-the-foundation-the-interview-mvp
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md
started: 2026-06-17T22:00:00Z
updated: 2026-06-17T22:05:00Z
---

## Current Test

testing complete

## Tests

### 1. Cold Start Smoke Test
expected: Backend and frontend both boot cleanly. Backend /api/health returns 200. Frontend serves landing page at /. Backend creates sessions.
result: pass

### 2. Landing Page
expected: Navigate to http://localhost:3000. See forest background hero, "Calm" heading, subtitle text, and "Begin Your Interview" CTA button.
result: pass
reported: "pass, but need to change the font color of text at nav menu to all black"
severity: cosmetic

### 3. Navigate to Interview
expected: Click "Begin Your Interview" on landing page. Arrive at /interview. See header "The Interview" and chat interface with input area and quick-answer buttons below.
result: pass

### 4. Interview Session Starts
expected: On /interview load, an initial greeting/question from the AI appears in the chat area.
result: pass
reported: "no greeting message, direct question related commute"

### 5. Send a Message
expected: Type a response in the text input and press Enter or click Send. AI streams a response back. Messages appear in scrollable history.
result: pass

### 6. Quick-Answer Buttons
expected: Click one of the quick-answer buttons (0-5, 5-20, 20+, Skip). Message is sent to AI and response streams back.
result: pass

### 7. Edition Page
expected: Navigate to /edition/[sessionId]. See footprint total (tonnes CO₂e/year), category breakdown bars, and pull quotes from interview.
result: issue
reported: "cannot navigate to edition. Also the chat is very barrent, doesnt reply in a good way."
severity: major

### 8. Edition Export
expected: On edition page, click "Export Image" button. A PNG file downloads with the edition layout. Clicking "Print / PDF" opens browser print dialog.
result: blocked
blocked_by: prior-phase
reason: "Cannot test — cannot navigate to edition page (Test 7)"

## Summary

total: 8
passed: 6
issues: 1
pending: 0
skipped: 0
blocked: 1

## Gaps

- truth: "Nav menu text should be all black for readability"
  status: failed
  reason: "User reported: need to change the font color of text at nav menu to all black"
  severity: cosmetic
  test: 2
  artifacts: []
  missing: []
  root_cause: ""

- truth: "Navigate to /edition/[sessionId] to see carbon footprint summary"
  status: failed
  reason: "User reported: cannot navigate to edition. Also the chat is very barrent, doesnt reply in a good way."
  severity: major
  test: 7
  artifacts: []
  missing: []
  root_cause: ""

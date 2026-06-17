---
status: testing
phase: 01-the-foundation-the-interview-mvp
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md
started: 2026-06-17T22:00:00Z
updated: 2026-06-17T22:05:00Z
---

## Current Test

number: 5
name: Send a Message
expected: |
  Type a response in the text input and press Enter or click Send. AI streams a response back with typewriter effect. Messages appear in scrollable history.
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
expected: Type a response in the text input and press Enter or click Send. AI streams a response back with typewriter effect. Messages appear in scrollable history.
result: issue
reported: "No response whatsoever, also when I send a message, the previous question is deleted"
severity: major

### 6. Quick-Answer Buttons
expected: Click one of the quick-answer buttons (0-5, 5-20, 20+, Skip). Message is sent to AI and response streams back.
result: blocked
blocked_by: prior-phase
reason: "Cannot test — message sending is broken (Test 5)"

### 7. Edition Page
expected: Navigate to /edition/[sessionId]. See footprint total (tonnes CO₂e/year), category breakdown bars, and pull quotes from interview.
result: blocked
blocked_by: prior-phase
reason: "Cannot test — interview cannot complete due to broken message sending (Test 5)"

### 8. Edition Export
expected: On edition page, click "Export Image" button. A PNG file downloads with the edition layout. Clicking "Print / PDF" opens browser print dialog.
result: blocked
blocked_by: prior-phase
reason: "Cannot test — interview cannot complete due to broken message sending (Test 5)"

## Summary

total: 8
passed: 4
issues: 1
pending: 0
skipped: 0
blocked: 3

## Gaps

- truth: "Nav menu text should be all black for readability"
  status: failed
  reason: "User reported: need to change the font color of text at nav menu to all black"
  severity: cosmetic
  test: 2
  artifacts: []
  missing: []
  root_cause: ""

- truth: "AI streams a response back when user sends a message"
  status: failed
  reason: "User reported: No response whatsoever, also when I send a message, the previous question is deleted"
  severity: major
  test: 5
  artifacts: []
  missing: []
  root_cause: ""

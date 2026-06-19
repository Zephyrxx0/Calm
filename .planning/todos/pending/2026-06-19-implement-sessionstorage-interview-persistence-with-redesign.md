---
created: 2026-06-19T14:48:34.734Z
title: Implement sessionStorage interview persistence with redesigned edition dialog
area: frontend
files:
  - frontend/src/components/chat/ChatInterface.tsx
  - frontend/src/app/interview/page.tsx
  - frontend/src/app/edition/[sessionId]/page.tsx
  - frontend/src/app/layout.tsx
---

## Problem

When the user clicks "Proceed to Edition" or navigates away from the interview
page, the chat history is lost because messages live only in React component
state. Returning to `/interview` starts a fresh session even if the user just
wanted to glance at the edition and come back.

The edition page tries to `fetch("/api/edition/{sessionId}")` which returns
404 — no edition API endpoint exists, and creating a database-backed API is
overkill for MVP.

The dialog that appears after the interview has only two options (Close / View
Your Edition). The user wants 4 controls: Proceed to Edition (primary), ✕
cross icon to dismiss and return to chat, Retake Interview (secondary), and
Export JSON (experimental).

## Solution

Store interview data in `sessionStorage` under key `calm_interview`. This
allows chat to persist across page navigations without a database, edition
page to read data directly from storage (no API needed), and chat to reset
only when "Retake Interview" is explicitly clicked.

### Files to modify

**1. ChatInterface.tsx:**
- Add `restoredMessages` / `restoredEndChatData` optional props
- Initialize `messages` and `endChatData` state from those props
- `useEffect` auto-saves to `sessionStorage` when state changes
- Redesign dialog with:
  - ✕ cross icon (top-right) → `setEndChatData(null)` (dismiss, stay on chat)
  - "Proceed to Edition" → primary button, navigate to `/edition/{sessionId}`
  - "Retake Interview" → secondary button, clear `sessionStorage`, navigate `/interview`
  - "Export JSON" → small dimmed button, blob-download as `.json`
- Export `Message` interface so interview/page.tsx can type its restored data

**2. interview/page.tsx:**
- On mount, check `sessionStorage.getItem("calm_interview")`
- If found, parse and restore `sessionId`, `userId`, `initialMessage`, `messages`, `endChatData`
- Pass restored messages/data as props to ChatInterface
- If not found, create fresh session (existing logic unchanged)

**3. edition/[sessionId]/page.tsx:**
- Replace `fetch("/api/edition/...")` with `sessionStorage.getItem("calm_interview")`
- Transform stored `endChatData` into the `SummaryData` shape the page expects
- Hardcode `benchmarks.global: 4.7`, national default to same
- Handle missing data gracefully — show error with link to interview
- Keep all existing render logic (OrganicBarChart, export PNG/PDF, benchmark toggle)

**4. layout.tsx (cosmetic):**
- Add `data-scroll-behavior="smooth"` to `<html>` element to suppress Next.js warning
- Font preload warnings are harmless — skip

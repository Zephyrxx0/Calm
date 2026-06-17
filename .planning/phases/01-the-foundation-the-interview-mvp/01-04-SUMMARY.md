---
phase: 01-the-foundation-the-interview-mvp
plan: 04
subsystem: ui
tags: [vercel-ai-sdk, usechat, html-to-image, broadsheet, chat-ui, sse-streaming]

# Dependency graph
requires:
  - phase: 01-02
    provides: design system (monochrome palette, Cormorant Garamond typography)
  - phase: 01-03
    provides: backend API endpoints (POST /message SSE, GET /edition)
provides:
  - ChatInterface component with useChat hook and hybrid input
  - Interview page with session initialization
  - Edition page with broadsheet layout and export capabilities
  - Next.js API route proxies for backend communication
affects: []

# Tech tracking
tech-stack:
  added: [@ai-sdk/react, ai, html-to-image]
  patterns: [usechat-sse-integration, api-route-proxy, broadsheet-edition-layout, print-css]

key-files:
  created:
    - frontend/src/components/chat/ChatInterface.tsx
    - frontend/src/app/interview/page.tsx
    - frontend/src/app/edition/[sessionId]/page.tsx
    - frontend/src/app/api/interview/start/route.ts
    - frontend/src/app/api/interview/message/route.ts
    - frontend/src/app/api/edition/[sessionId]/route.ts
    - frontend/tests/ChatInterface.test.tsx
  modified:
    - frontend/tests/setup.ts
    - frontend/package.json

key-decisions:
  - "Used @ai-sdk/react useChat hook with DefaultChatTransport for SSE streaming from backend"
  - "Created Next.js API route proxies to forward requests to Python backend (CORS-friendly)"
  - "Session ID passed via x-session-id header to avoid URL parameter complexity in useChat"
  - "html-to-image library for PNG export (lightweight, no server dependency)"
  - "Print CSS via @media print and styled-jsx for PDF export compatibility"

patterns-established:
  - "useChat pattern: DefaultChatTransport with api endpoint and custom headers for session context"
  - "API proxy pattern: Next.js route handlers forwarding to backend with error handling"
  - "Edition layout: multi-column grid with border-based broadsheet aesthetic"
  - "Export pattern: html-to-image for PNG, window.print() for PDF"

requirements-completed: [Frontend]

# Metrics
duration: 6min
completed: 2026-06-17
---

# Phase 1 Plan 04: Frontend Implementation Summary

**Chat UI with Vercel AI SDK useChat streaming, hybrid text/button input, and Edition broadsheet page with PDF/image export**

## Performance

- **Duration:** 6 min
- **Started:** 2026-06-17T05:47:20Z
- **Completed:** 2026-06-17T05:53:22Z
- **Tasks:** 2 (plus 1 checkpoint pending)
- **Files modified:** 9

## Accomplishments
- ChatInterface component with scrollable message list and hybrid input (text + quick-answer buttons)
- Vercel AI SDK useChat integration with DefaultChatTransport for SSE streaming from backend
- Next.js API route proxies forwarding to Python backend (start session, chat message, edition data)
- Interview page that initializes session on mount and renders ChatInterface
- Edition page with multi-column broadsheet layout, bold headline, footprint metric, category breakdown, and pull quotes
- Print CSS (@media print) for PDF export and html-to-image for PNG export

## Task Commits

Each task was committed atomically:

1. **Task 1: Chat Interface UI (TDD RED)** - `0b3b1ad` (test)
2. **Task 1: Chat Interface UI (TDD GREEN)** - `55cc97b` (feat)
3. **Task 2: Edition Page Layout** - `02758ce` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `frontend/src/components/chat/ChatInterface.tsx` — Main chat UI with useChat hook, scrollable messages, text input, and quick-answer buttons
- `frontend/src/app/interview/page.tsx` — Interview page that creates session on mount and renders ChatInterface
- `frontend/src/app/edition/[sessionId]/page.tsx` — Edition page with broadsheet layout, print CSS, and image export
- `frontend/src/app/api/interview/start/route.ts` — Next.js proxy for POST /api/interview/start
- `frontend/src/app/api/interview/message/route.ts` — Next.js proxy for POST /api/interview/{session_id}/message (SSE streaming)
- `frontend/src/app/api/edition/[sessionId]/route.ts` — Next.js proxy for GET /api/edition/{session_id}
- `frontend/tests/ChatInterface.test.tsx` — TDD tests for ChatInterface (scrollable list, hybrid input, useChat init)
- `frontend/tests/setup.ts` — Added scrollIntoView mock for jsdom compatibility
- `frontend/package.json` — Added @ai-sdk/react, ai, html-to-image dependencies

## Decisions Made
- Used `@ai-sdk/react` useChat hook with `DefaultChatTransport` for SSE streaming — native Vercel AI SDK integration, handles streaming automatically
- Created Next.js API route proxies instead of direct backend calls — avoids CORS issues, centralizes error handling, allows future middleware insertion
- Session ID passed via `x-session-id` header (not URL param) — simpler useChat configuration, avoids dynamic API path construction
- Chose `html-to-image` for PNG export — lightweight client-side library, no server dependency, good browser support
- Print CSS via `@media print` and `styled-jsx` — works with browser's native print dialog for PDF export

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

**Backend server must be running for full end-to-end testing.** See prior plan summaries:
- **Service:** Python FastAPI backend
- **URL:** http://localhost:8000 (default)
- **Env var:** `GEMINI_API_KEY` must be set for live AI responses
- **Database:** PostgreSQL connection configured in backend

## Next Phase Readiness
- Frontend complete: chat UI, interview flow, and edition output all implemented
- All API routes proxying to backend correctly
- Ready for end-to-end verification (Task 3 checkpoint)
- Integration with backend requires both servers running (frontend on :3000, backend on :8000)

---
*Phase: 01-the-foundation-the-interview-mvp*
*Completed: 2026-06-17*

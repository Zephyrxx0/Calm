---
plan: 03-03
status: complete
started: 2026-06-18T15:38:00Z
completed: 2026-06-18T15:41:00Z
---

# Plan 03-03: Sharing, Export & Public Links

## What Was Built
Multi-format sharing for carbon reports: public web links, dynamic social cards, and local downloads (Image + PDF).

## Key Decisions
- Share page is read-only with no editing capabilities (per D-27)
- OG image renders using `next/og` (Satori) at Edge runtime — 1200x630 standard
- PDF export uses html-to-image (2x pixelRatio) + jsPDF client-side (no headless browser needed)
- Share link creates a snapshot via existing POST /api/snapshot endpoint

## Key Files

### Created
- `frontend/src/app/share/[snapshotId]/page.tsx` — Public read-only report view
- `frontend/src/app/api/og/route.tsx` — Dynamic social share card generator

### Modified
- `frontend/src/app/edition/[sessionId]/page.tsx` — Added Share Link, Download PDF, Download Image buttons

## Checkpoint: Human Verification Required
The following items need manual testing:
1. Click "Download Image" → verify .png file saves correctly
2. Click "Download PDF" → verify .pdf file saves (A4 format)
3. Click "Share Link" → copy URL, open in incognito → verify report visible

## Self-Check: PASSED
- [x] Share page renders snapshot data with chart
- [x] OG endpoint returns ImageResponse with correct dimensions
- [x] PDF export handler uses jsPDF with html-to-image capture
- [x] Share Link creates snapshot and copies URL
- [x] TypeScript compiles cleanly
- [x] All tests passing

# Phase 4: Social & Sharing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 4-social-sharing  
**Areas discussed:** Persistence Strategy, Streak Tracking Interface, Daily Input Method, Newspaper Export Layout, Social Format Optimization

---

## Persistence Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Device-local only | localStorage/indexedDB, works offline, data tied to browser/device | |
| Minimal accounts | Email-only signup, cross-device sync (breaks no-auth principle) | ✓ |
| Hybrid approach | Start local, optional account upgrade for sync later | |
| Session extension | Longer-lived UUIDs with device fingerprinting (no true accounts) | |

**User's choice:** Minimal accounts with Firebase Auth
**Notes:** User chose Firebase specifically after asking about service options (Supabase, Firebase, NextAuth.js, Clerk)

---

## Streak Tracking Interface

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub-style contribution graph | Calendar grid with color intensity for daily entries (green squares, organic styling) | ✓ |
| Simple streak counter | "7-day streak" text with organic accent styling, minimal visual footprint | |
| Calendar view | Monthly calendar layout with entries marked, fits the broadsheet aesthetic | |
| Organic timeline | Vertical flowing timeline with doodle-styled markers for each day | |

**User's choice:** GitHub-style contribution graph
**Notes:** User specifically requested "crayon drawn" aesthetic enhancement - hand-drawn squares with organic, sketchy borders

---

## Daily Input Method

| Option | Description | Selected |
|--------|-------------|----------|
| Quick daily form | Simple 3-4 field form (transport, meals, energy) with preset options, 30-second entry | |
| Mini-interview | Shortened version of the main interview (5-7 questions vs 20-25), guided but faster | |
| Ledger integration | Daily photo uploads (receipts, meal photos) processed by Gemini, visual but requires photos | |
| Hybrid approach | Quick form for regular days, full ledger for detailed days, user chooses | ✓ |

**User's choice:** Hybrid approach where user chooses between quick form or ledger
**Notes:** User specified 6-7 questions for the quick form (expanded from suggested 3-4)

---

## Newspaper Export Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Enhanced current design | Keep existing edition layout, add newspaper masthead and better typography | |
| True broadsheet dimensions | Actual newspaper proportions (11"x17"), multiple columns, traditional newspaper typography | ✓ |
| Hybrid newspaper | Newspaper visual elements (masthead, columns, bylines) but optimized for digital sharing sizes | |
| Print-ready broadsheet | Full newspaper layout designed for actual printing, complete with fold lines | |

**User's choice:** True broadsheet dimensions
**Notes:** Selected option 2 - actual newspaper proportions with traditional layout

---

## Social Format Optimization

| Option | Description | Selected |
|--------|-------------|----------|
| LinkedIn focus | Professional post templates, career/sustainability angle, LinkedIn card dimensions (1200x627) | |
| Twitter/X cards | Compact summary cards (1200x600), key stats highlighted, Twitter-optimized text | |
| Instagram stories | Vertical format (1080x1920), visual-first design for mobile sharing | |
| Universal social images | One size fits most platforms (1200x630), works across LinkedIn/Twitter/Facebook | ✓ |

**User's choice:** Universal social images
**Notes:** Single format (1200x630) for cross-platform compatibility

---

## Claude's Discretion

No areas where user delegated decisions to Claude.

## Deferred Ideas

- **sessionStorage interview persistence:** Reviewed todo but deferred as foundational improvement, not directly related to Phase 4 social sharing scope.
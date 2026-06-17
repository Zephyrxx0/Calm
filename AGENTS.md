# AGENTS.md — Calm

## Identity

Carbon awareness platform. Conversational AI coach (Gemini) that interviews users about their lifestyle, calculates a carbon footprint estimate, and outputs a personalized "newspaper edition" styled as a vintage broadsheet.

## State

**Phase 0 — Initialization.** Zero code written. No commits. No package.json, no build config, no Dockerfile, no schema. The `.planning/` directory holds the roadmap, requirements, and project spec. First real work is Phase 1 (MVP): "The Interview" feature.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js |
| Backend | Python (separate service) |
| Database | PostgreSQL |
| AI | Google Cloud AI (Gemini) |
| Design | Vintage Broadsheet, monochrome (`#FDFCF7` / `#1A1A1A`), serif typography (Cormorant or Garamond) |

## Project structure

```
.agents/skills/        — Installed OpenCode skills (do not edit)
.planning/             — Requirements, roadmap, project state
.planning/PROJECT.md   — Core product concept
.planning/REQUIREMENTS.md — MVP details
.planning/ROADMAP.md   — Phase breakdown (4 phases)
.planning/STATE.md     — Current phase tracking
skills-lock.json       — Skill version lock (do not edit)
AGENTS.md              — This file
```

## Conventions & gotchas

- `.agents/` and `skills-lock.json` are gitignored — they are local to the agent environment and intentionally excluded from version control.
- No code has been scaffolded yet. Any agent attempting to run, build, or test will need to create the project from scratch.
- Design must follow the "Vintage Broadsheet" spec: monochrome, serif-heavy, column-based layout, no cards or colored buttons. The `design-taste-frontend`, `high-end-visual-design`, and `impeccable` skills are available for implementation guidance.
- MVP is ephemeral (no user accounts). The interview flow is: landing → chat (one question at a time) → personalized newspaper output page.
- Backend is a separate Python service, not a Next.js API route. The Python service handles conversation state, Gemini API calls, and carbon calculation.
- When starting work, the expected order is: Next.js scaffold → Python service scaffold → PostgreSQL schema → AI integration → frontend chat UI → carbon model → Edition output page.

## Key files

- `.planning/PROJECT.md` — product vision and three features (Interview, Ledger, Edition)
- `.planning/REQUIREMENTS.md` — detailed MVP user flow and technical/design requirements
- `.planning/ROADMAP.md` — all 4 phases with deliverables

instead of creating components, first search the registeries.

use context7 for docs

Whenever '/gsd-discuss-phase' is prompted, before writing any files, and most prefferably starting the actual discussion if possible, create a branch in the format `phase-<phase-number>-<short desc>` . Switch to new branch and write files there.

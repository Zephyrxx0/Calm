# Phase 1: The Foundation & The Interview (MVP) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 1-The Foundation & The Interview (MVP)
**Areas discussed:** Conversation flow control, Chat input design, Carbon calculation model, Edition page rendering

---

## Conversation Flow Control

| Option | Description | Selected |
|--------|-------------|----------|
| State machine + AI wrapper | Backend defines fixed Q sequence, Gemini wraps in conversational language | ✓ |
| AI-driven flow | Gemini decides next Q adaptively | |

| Option | Description | Selected |
|--------|-------------|----------|
| Linear fixed sequence | Same questions every time | |
| Conditional branching | Answers unlock follow-up Qs | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Commute, Travel, Home Energy, Diet | Original 4 MVP categories | |
| Add Shopping & Consumption | 5 categories total | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| 10-15 questions (focused) | ~5 min interview | |
| 20-25 questions (thorough) | ~10 min, rich output | ✓ |

**User's choice:** State machine + AI wrapper, conditional branching, 5 categories, 20-25 questions
**Notes:** Categories expanded from original 4 to 5 (added Shopping & Consumption).

---

## Chat Input Design

| Option | Description | Selected |
|--------|-------------|----------|
| Standard text input | Simple bottom-anchored text box | |
| Typewriter-styled input | Monospace, ink-colored, broadsheet feel | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Free text for everything | User types "20 miles", AI parses | |
| Structured inputs for numbers | Number fields for quantitative Qs | |
| Hybrid: free text + suggested buttons | Text + quick-answer buttons | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Scrollable chat history | All Q&A visible | ✓ |
| One Q at a time, fade transition | Only current Q visible | |

| Option | Description | Selected |
|--------|-------------|----------|
| Instant message | Full Q appears at once | |
| Typewriter/streaming effect | Character-by-character | ✓ |

**User's choice:** Typewriter input, hybrid free text + buttons, scrollable history, streaming AI output
**Notes:** Streaming effect reinforces the "AI journalist is writing the interview" metaphor.

---

## Carbon Calculation Model

| Option | Description | Selected |
|--------|-------------|----------|
| Python with hardcoded coefficients | CO2 factors in code, deterministic | |
| AI-assisted lookup | Gemini extracts structured data, Python calculates | ✓ (mix) |
| Fully AI-driven estimate | Gemini estimates directly | |

| Option | Description | Selected |
|--------|-------------|----------|
| Precise input-specific factors | Diff coefficients per answer type | |
| Category-level averages | One factor per category | ✓ (agent chose) |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, structured JSON payload | Gemini returns JSON + conversation | ✓ |
| No, backend parses free text | Backend extracts numbers from raw text | |

**User's choice:** Mix of Python coefficients + Gemini structured JSON extraction. Category-level averages. User delegated coefficient detail to agent with instruction to prioritize UX.
**Notes:** User asked to add coefficient validation to TODO.

---

## Edition Page Rendering

| Option | Description | Selected |
|--------|-------------|----------|
| React client-side component | Frontend renders from JSON | ✓ |
| Server-rendered HTML from Python | Python generates HTML | |

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic route `/edition/[sessionId]` | Unique URL per interview | ✓ |
| Single page with query param | Data from hash/query | |

| Option | Description | Selected |
|--------|-------------|----------|
| Print-friendly CSS | Cmd+P → PDF | ✓ (both) |
| Save as image | html-to-image PNG | ✓ (both) |
| Not for MVP | Later in Phase 3 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Headline, footprint, breakdown, pull quote, top 3 actions | REQUIREMENTS.md scope | |
| All above + category comparison bars + full Q&A transcript | Extra depth | ✓ |

**User's choice:** React client-side, dynamic route, both print + image export, includes full Q&A transcript + comparison bars.
**Notes:** Full transcript makes the Edition feel like a complete "article" about the user.

---

## the agent's Discretion

- Coefficient detail level: category-level averages selected by agent (preferred for UX, matches MVP simplicity constraint)

## Deferred Ideas

None.

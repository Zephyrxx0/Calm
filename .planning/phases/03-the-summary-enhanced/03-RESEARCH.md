# Phase 03: The Summary, Enhanced - Research

**Researched:** 2026-06-18
**Domain:** Data Visualization, Reporting, and Sharing
**Confidence:** HIGH

## Summary

This phase focuses on deepening the value of "The Edition" (the personalized carbon summary) by adding sophisticated data visualizations, comparative benchmarks, and multi-format sharing capabilities. The core challenge is maintaining the "Calm" and "Organic" aesthetic while introducing technical components like charting libraries and export utilities.

**Primary recommendation:** Use **Recharts** for the structural foundation of charts, but use the `shape` prop to inject custom **Organic SVG paths** (hand-drawn style) to maintain brand alignment. Implement sharing via a combination of **Next.js Open Graph (OG) image generation** for social cards and a **PostgreSQL-backed snapshot system** for public read-only links.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Data Visualization | Browser / Client | — | Recharts is a client-side React library. |
| PDF/Image Export | Browser / Client | — | Using `html-to-image` and `jsPDF` for client-side "WYSWYG" capture. |
| Social Card Gen | Frontend Server (SSR) | — | Using `next/og` (Edge/Server) to generate dynamic OG images. |
| Snapshot Persistence | API / Backend | Database | Backend saves JSON snapshots to PostgreSQL for public links. |
| Benchmark Logic | API / Backend | — | National/Global average data served by the API. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `recharts` | 2.12.7 | Charting | Standard React charting library; high flexibility via custom shapes. [VERIFIED: npm registry] |
| `jspdf` | 2.5.1 | PDF Generation | Reliable for "stamping" images into PDFs. [VERIFIED: npm registry] |
| `html-to-image` | 1.11.13 | UI Capture | Already in `package.json`. Used for both PNG and PDF export. [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/og` | Built-in | OG Images | Generation of dynamic social share cards. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js | Recharts is more "React-way" and easier to customize with SVG components. |
| `html-to-image` | `@react-pdf/renderer` | `react-pdf` requires rewriting the entire UI specifically for PDF; `html-to-image` is a 1:1 capture. |

**Installation:**
```bash
pnpm install recharts jspdf
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `recharts` | npm | 8 yrs | ~1.3M/wk | github.com/recharts/recharts | [OK] | Approved |
| `jspdf` | npm | 13 yrs | ~500k/wk | github.com/parallax/jsPDF | [OK] | Approved |

## Architecture Patterns

### System Architecture Diagram

```mermaid
graph TD
    User((User)) -->|Views| EditionPage[Edition Page /summary]
    EditionPage -->|Selects| Benchmarks[Benchmark Toggle]
    EditionPage -->|Clicks Share| ShareHandler[Share Handler]
    
    subgraph Frontend (Next.js)
        EditionPage -->|Renders| Recharts[Recharts + Organic Shapes]
        ShareHandler -->|Download| ClientExport[html-to-image + jsPDF]
        ShareHandler -->|Generate Link| SnapshotAPI[POST /snapshot]
        OGEndpoint[/api/og] -->|Renders| OGImage[OG Image Response]
    end
    
    subgraph Backend (FastAPI)
        SnapshotAPI -->|Save| DB[(PostgreSQL)]
        SnapshotAPI -->|AI Flavor| Gemini[Gemini 1.5]
    end
    
    OGEndpoint -->|Reads| DB
```

### Recommended Project Structure
```
frontend/src/
├── app/
│   ├── api/
│   │   └── og/              # [NEW] OG image generation endpoint
│   └── share/
│       └── [snapshotId]/    # [NEW] Read-only snapshot view
└── components/
    └── charts/              # [NEW] Custom Recharts wrappers
        ├── OrganicBar.tsx
        └── BenchmarkComparison.tsx

backend/app/
├── models/
│   └── snapshot.py          # [NEW] Snapshot DB model
└── api/
    └── snapshot.py          # [NEW] Snapshot persistence endpoints
```

### Pattern 1: Recharts Custom Organic Shape
**What:** Using the `shape` prop in Recharts to render a hand-drawn SVG path instead of a perfect rectangle.
**When to use:** All bar and area charts to maintain the "Calm" aesthetic.
**Example:**
```tsx
// Source: https://recharts.org/en-US/examples/CustomShapeBarChart
const OrganicBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  // Use a path with slightly rough edges/rounded corners
  const path = `M${x},${y + height} L${x},${y + 10} Q${x},${y} ${x + 10},${y} L${x + width - 10},${y} Q${x + width},${y} ${x + width},${y + 10} L${x + width},${y + height} Z`;
  return <path d={path} stroke="none" fill={fill} />;
};
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart primitives | Custom SVG charts | Recharts | Accessibility, tooltips, and responsive logic are hard to get right. |
| PDF Layout | Manual PDF building | `html-to-image` + `jsPDF` | Maintaining two layouts (Web + PDF) is a huge overhead. |
| Social Card Gen | Static images | `next/og` (Satori) | Dynamic stats in cards require a server-side rendering engine. |

## Common Pitfalls

### Pitfall 1: `html-to-image` failing on fonts
**What goes wrong:** Exported images/PDFs show fallback fonts instead of the brand fonts.
**Why it happens:** External fonts might not be embedded in the SVG context used by the library.
**How to avoid:** Ensure fonts are loaded and use the `fontEmbedCSS` option if necessary.

### Pitfall 2: Snapshot Data Staleness
**What goes wrong:** A user updates their ledger, but the shared "Public Link" doesn't change.
**Why it happens:** Snapshots are static point-in-time copies.
**How to avoid:** Clearly label snapshots as "Static Report from [Date]" and allow users to "Update Snapshot".

## Code Examples

### Benchmark Data (Backend)
```python
# [ASSUMED] Typical 2024 averages for comparison
CARBON_BENCHMARKS = {
    "global": 4.7,
    "US": 14.5,
    "UK": 4.25,
    "EU": 6.3,
    "India": 1.9,
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Puppeteer for PDFs | `html-to-image` | 2022+ | No need for a heavy headless browser on the server. |
| Static OG Images | `next/og` (Satori) | 2023 | High-performance, React-based dynamic image generation. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Recharts `shape` prop is sufficient for "Organic" look | Pattern 1 | UX might feel "too rigid" if custom paths are too subtle. |
| A2 | `html-to-image` supports all CSS used in Calm | Core Stack | Some complex CSS (filters/blurs) might not render in export. |

## Open Questions (RESOLVED)

1. **Country Detection:** (RESOLVED) Use user-selected toggle for benchmarks as per D-25; IP-based detection is deferred as an enhancement. The system will default to Global Average if no selection is made.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Snapshots | ✓ | 15.x | — |
| Gemini API | Insights | ✓ | 1.5 Flash | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Pytest |
| Config file | `frontend/vitest.config.ts` / `backend/pytest.ini` |
| Quick run command | `pnpm test` / `pytest` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-03-01 | Detailed breakdown in summary | integration | `vitest frontend/tests/Summary.test.tsx` | ❌ Wave 0 |
| REQ-03-02 | Benchmarking comparison | unit | `pytest backend/tests/test_benchmarks.py` | ❌ Wave 0 |
| REQ-03-03 | Public Link (Snapshots) | API | `pytest backend/tests/test_snapshots.py` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | Use non-sequential UUIDs for shared snapshot links. |
| V5 Input Validation | yes | Validate snapshot payload via Pydantic. |

### Known Threat Patterns for Next.js/FastAPI

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Snapshot Enumeration | Information Disclosure | Use v4 UUIDs for public IDs. |
| PDF Injection | Tampering | `html-to-image` runs client-side, reducing server-side injection risk. |

## Sources

### Primary (HIGH confidence)
- [Recharts Documentation] - Custom Shape patterns.
- [Next.js Documentation] - `next/og` generation.
- [Our World in Data] - Carbon footprint benchmarks.

### Secondary (MEDIUM confidence)
- [html-to-image GitHub] - Browser compatibility notes.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Core libraries are mature and widely used.
- Architecture: HIGH - Follows established patterns for sharing and snapshots.
- Pitfalls: MEDIUM - Export fidelity is notoriously tricky across browsers.

**Research date:** 2026-06-18
**Valid until:** 2026-07-18

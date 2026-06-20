---
sketch: 002
name: svg-filters
question: "Which vintage filter layers are visually essential vs. distracting?"
winner: null
tags: [filters, svg, paper-texture, halftone, ink-bleed, fold-crease]
---

# Sketch 002: SVG Filter Effects

## Design Question
Which vintage filter layers contribute most to the newspaper realism, and which are distracting or imperceptible? Compare interactive toggling, before/after side-by-side, and cumulative stacking.

## How to View
open .planning/sketches/002-svg-filters/index.html

## Variants
- **A: Interactive Layer Toggle** — Toggle individual filter layers on/off from the control panel (grain, halftone, ink bleed, fold crease, vignette). See each layer's contribution in real time.
- **B: Side-by-Side (Before/After)** — Clean HTML on the left, all filters applied on the right. Quick comparison of the full effect.
- **C: Stacked Progression** — Scroll through cumulative layers: clean → +grain → +halftone → +ink bleed → +fold crease. See the newspaper build up layer by layer.

## What to Look For
- **Paper grain (feTurbulence):** Does the noise feel like newsprint or just dirty?
- **Halftone dots (feColorMatrix):** Do images actually look dot-screened? Is the pattern visible enough?
- **Ink bleed (feGaussianBlur):** Does the subtle blur on bold headlines read as ink spread or just blurry text?
- **Fold crease:** Does the horizontal fold line with shadow feel authentic?
- **Vignette:** Does the edge darkening help or hurt readability?
- **Combined effect:** Do all layers together feel like a real scanned newspaper, or over-processed?

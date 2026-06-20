---
sketch: 003
name: column-flow
question: "How do Playfair Display headlines + PT Serif body read at newspaper sizes in 4 vs. 5 vs. 6 columns?"
winner: null
tags: [typography, columns, justification, hyphenation, readability]
---

# Sketch 003: Typography & Column Flow

## Design Question
How does column density affect readability and newspaper authenticity? Compare Playfair Display headlines + PT Serif body across 4, 5, and 6 columns with justified text, column rules, and hyphenation. Which density produces the best balance of readability, content density, and vintage newspaper feel?

## How to View
open .planning/sketches/003-column-flow/index.html

## Variants
- **A: 4 Columns (standard)** — 0.45in gap, 1px column rules, 9.5px body text. The most open and readable layout. Matches the broadsheet reference.
- **B: 5 Columns (denser)** — 0.3in gap, 0.5px rules, same body size. More content per page, tighter columns. Common in real newspapers.
- **C: 6 Columns (tightest)** — 0.2in gap, 0.5px rules, 8.5px body text. Maximum density. Classic broadsheet column count but can feel cramped.

## What to Look For
- **Justification quality:** Do ragged-right edges or rivers of whitespace appear in any variant?
- **Column width:** Are 6-column lines too short for comfortable reading (fewer than 35-40 characters)?
- **Hyphenation:** Does `hyphens: auto` produce natural-looking breaks?
- **Content consumption:** Can you scan and find a specific section quickly?
- **Newspaper authenticity:** Which column count feels most like a real printed newspaper?
- **At smaller viewports (phone/tablet):** All three collapse to 2 columns — do they all degrade gracefully?

---
status: approved
reviewed_at: 2026-06-17T12:00:00Z
---

# UI Design Contract: Phase 1 - The Foundation & The Interview (MVP)

## 1. Aesthetic & Principles
- **Style**: Calm & Cozy — quiet, warm, minimal
- **Principles**: Soft colors, generous whitespace, rounded corners, subtle shadows. No harsh borders or high contrast. The interface should feel like a breath.

## 2. Spacing
- **Scale**: 8-point system (4px, 8px, 16px, 24px, 32px, 48px, 64px)
- **Container max-width**: 640px for chat, 720px for content pages
- **Section padding**: 32px–48px vertical, 24px horizontal

## 3. Typography
- **Families**: 
  - Primary: System sans-serif stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
  - Mono: System monospace for data only
- **Sizes**:
  - `sm` (14px) - Meta/captions
  - `base` (16px) - Body text
  - `lg` (20px) - Subheadings
  - `xl` (28px) - Page headings
  - `2xl` (36px) - Hero headlines
- **Weights**: Regular (400), Medium (500), Semibold (600)
- **Line Heights**: Body (1.6), Headings (1.3)
- **Letter Spacing**: -0.01em for headings, 0 for body

## 4. Color
- **Background**: `#FAFAF8` (warm off-white)
- **Surface**: `#FFFFFF` (cards, inputs)
- **Text Primary**: `#2C2C2A` (warm dark gray)
- **Text Secondary**: `#6B6B68` (muted warm gray)
- **Text Tertiary**: `#9A9A97` (light muted)
- **Accent**: `#7A8B6F` (soft sage green)
- **Accent Hover**: `#6B7C60` (darker sage)
- **Border**: `#E5E5E2` (soft warm gray)
- **Border Focus**: `#7A8B6F` (sage)

## 5. Copywriting
- **Primary CTA**: "Begin Your Interview"
- **Empty State Copy**: "No messages yet. Your interview will appear here."
- **Error State Copy**: "Something went wrong. Please try again."
- **Destructive Actions**: None defined for this phase.

## 6. Components & Registry
- **Registries Used**: shadcn official (`radix-nova` style)
- **Third-Party Registries**: none
- **Component Modifications**: 
  - Buttons: Rounded (8px), subtle background colors, no harsh borders
  - Inputs: Rounded (8px), soft borders, gentle focus ring in sage
  - Cards: Rounded (12px), subtle shadow, white background

## 7. Layout Architecture
- Single, clear call-to-action on landing page.
- Interview: Scrollable chat history, centered, max-width 640px.
- Summary: Clean, organized layout with category breakdown and insights.

## 8. Motion
- **Transitions**: 150ms ease-out for hover states
- **Message appearance**: Subtle fade-in (200ms)
- **Reduced motion**: Respect `prefers-reduced-motion`

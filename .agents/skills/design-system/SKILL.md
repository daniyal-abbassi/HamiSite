---
name: design-system
description: Design-system guidance with tokens, component behavior, responsive rules, and accessibility standards for HAMI ("Aura" world). Use when creating or updating UI rules, component specifications, design tokens, or QA checklists.
---

# Hami Hamrah Design System ("Aura" World)

## Brand Identity & Foundations
- **Canvas / Atmosphere:** Near-black ink canvas (`#1B0A0E` / `#550A17`) with atmospheric RAL 3004 oxblood radial-gradient glow (`#640211`).
- **Primary Accent:** Bone / Muted Aqua (`#C9C2BE` / `#D6CFCB`) for prices, primary CTAs, and active states.
- **Signal Accent:** Signal Ember (`#E4573F`) strictly for spinning rims (`.shiny-edge`) and live status dots.
- **Geometry:** Fully rounded pills (`rounded-full`) for all buttons and chips; 22-34px rounded radii for cards and panels.
- **Surface Material:** Frosted glass (`backdrop-filter: blur(18px)`) with gradient hairline borders.
- **Typography:** Self-hosted Estedad Variable (Persian) + Vazirmatn Variable (fallback) + DM Mono (labels and numbers).

## Accessibility (WCAG 2.2 AA)
- Minimum contrast: 4.5:1 for body text, 3:1 for large text and UI components.
- Visible focus-visible rings for keyboard users.
- RTL layout direction throughout (`dir="rtl"`).


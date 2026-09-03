---
name: design-system-contentsquare-all
description: Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.
---

<!-- TYPEUI_SH_MANAGED_START -->

# Contentsquare: all

## Mission
Deliver implementation-ready design-system guidance for Contentsquare: all that can be applied consistently across marketing site interfaces.

## Brand
- Product/brand: Contentsquare: all
- URL: https://contentsquare.com/
- Audience: buyers, teams, and decision-makers
- Product surface: marketing site

## Style Foundations
- Visual style: structured, accessible, implementation-first
- Main font style: `font.family.primary=__Inter_697da2`, `font.family.stack=__Inter_697da2, __Inter_Fallback_697da2, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji`, `font.size.base=16px`, `font.weight.base=400`, `font.lineHeight.base=22.4px`
- Typography scale: `font.size.xs=12px`, `font.size.sm=13px`, `font.size.md=14px`, `font.size.lg=15px`, `font.size.xl=16px`, `font.size.2xl=18px`, `font.size.3xl=20px`, `font.size.4xl=22px`
- Color palette: `color.text.primary=#ffffff`, `color.text.secondary=#0d0d0d`, `color.surface.base=#000000`, `color.text.inverse=#5252db`, `color.surface.muted=#f7f8f6`, `color.surface.strong=#7c0033`, `color.border.default=#e5e7eb`
- Spacing scale: `space.1=4px`, `space.2=6px`, `space.3=7.2px`, `space.4=8px`, `space.5=10px`, `space.6=12px`, `space.7=16px`, `space.8=20px`
- Radius/shadow/motion tokens: `radius.xs=4.6px`, `radius.sm=6px`, `radius.md=8px`, `radius.lg=50px`, `radius.xl=9999px` | `motion.duration.instant=100ms`, `motion.duration.fast=150ms`, `motion.duration.normal=200ms`, `motion.duration.slow=300ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.
- Responsive behavior and edge-case handling should be specified for every component family.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->

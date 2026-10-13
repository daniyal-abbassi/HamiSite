# Feature Specification: Interaction Design Polish & Microinteractions

**Feature Directory**: `specs/030-interaction-design`  
**Created**: 2026-10-13  
**Status**: Draft  
**Skill Reference**: `https://farsiui.ir/skills/interaction-design`  

---

## Executive Summary

Implement systematic **Interaction Design** standards across Hami Hamrah. Ensure all interactive components feature complete state lifecycles (Default, Hover, Active/Pressed, Focus-Visible, Disabled, Loading, Success/Error), snappy and purposeful microinteractions ($\le 150\text{ms}$), fluid bottom-sheet / modal transitions (200–300ms), tactile physical feedback (`active:scale-95`), and optimistic cart and UI state transitions without layout thrashing.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tactile Microinteractions & Complete State Lifecycles (Priority: P1) 🎯 MVP

As a shopper or business partner interacting with buttons, chips, tabs, and cards, I want immediate, tactile visual feedback on press and hover ($\le 100\text{ms}$) so the interface feels direct, responsive, and physical.

**Why this priority**: Microinteractions bridge the gap between static web elements and physical devices. Missing `:active` or hover states make a web app feel sluggish, dead, or unresponsive.

**Independent Test**: Click or tap any primary CTA, filter chip, or product card; verify that a subtle scaling or elevation feedback occurs instantaneously ($\le 100\text{ms}$) without layout displacement, and releases cleanly upon mouse up.

**Acceptance Scenarios**:
1. **Given** primary and secondary buttons (e.g. Hero CTAs, Add-to-Cart buttons, partner forms), **When** pressed/clicked, **Then** an instantaneous physical depression state (`active:scale-[0.98]` or `active:scale-95`) triggers without delaying event dispatch.
2. **Given** any interactive control, **When** evaluating its states, **Then** all 6 core states (`default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`) are visually distinct and fully functional.
3. **Given** disabled controls, **When** interacted with, **Then** pointer events are disabled, cursor indicates unavailable state, and no active/hover animations fire.

---

### User Story 2 - Fluid Transitions & Modal Motion Choreography (Priority: P1)

As a customer opening dialogs, filters, or quick menus, I want surface transitions to follow natural easing curves (200–300ms cubic-bezier) and animate only compositor properties (`transform` and `opacity`) so the app never stutters or drops frames.

**Why this priority**: Poorly timed transitions (e.g. >500ms or animating `width`/`height`) feel sluggish and cause GPU layout recalculations. Standard duration bands guarantee fluid 60fps responsiveness.

**Independent Test**: Open and dismiss modals, mobile docks, and dropdowns; verify that entrance/exit animations stay strictly within 200–300ms duration bands, maintain 60fps, and collapse instantly under `prefers-reduced-motion`.

**Acceptance Scenarios**:
1. **Given** modal dialogs, drawers, and popovers, **When** appearing, **Then** entrance transitions use fast ease-out (`cubic-bezier(0, 0, 0.2, 1)`) within 200–300ms.
2. **Given** dismissed dialogs or menus, **When** closing, **Then** exit transitions use accelerating ease-in within 150–200ms.
3. **Given** layout animations, **When** inspected in DevTools Performance panel, **Then** animations touch exclusively `transform` and `opacity` layers.

---

### User Story 3 - Async Operation Feedback & Optimistic UI Updates (Priority: P2)

As a shopper adding products to the cart or submitting requests, I want immediate visual acknowledgment and smooth optimistic updates so I am never left wondering whether my click succeeded.

**Why this priority**: Waiting for server network roundtrips before giving visual feedback creates perceived lag and induces multiple frantic clicks.

**Independent Test**: Click "افزودن به سبد" (Add to Cart); verify immediate badge feedback or visual confirmation, followed by non-blocking cart drawer updates.

**Acceptance Scenarios**:
1. **Given** an action triggering an async network request (0.1s – 1.0s), **When** clicked, **Then** a localized spinner or disabled state appears within 100ms.
2. **Given** cart addition actions, **When** tapped, **Then** optimistic feedback updates badge count immediately while background synchronization proceeds.
3. **Given** async request failure, **When** the error occurs, **Then** an accessible toast notification or inline feedback announces the failure with a retry action.

---

## Edge Cases & Defensive Constraints

- **Touch Device Hover Ghosting**: On mobile touchscreens, `:hover` pseudo-classes can stick after tapping. Use `@media (hover: hover)` or explicit touch-tested classes so buttons don't stay visually hovered after touch release.
- **Vestibular Sensitivity**: Under `prefers-reduced-motion: reduce`, all duration bands collapse to `<= 0.01ms`.
- **Keyboard Parity**: Every microinteraction must be triggerable via keyboard (`Enter`, `Space`) with identical feedback to mouse/touch.

---

## Requirements Checklist

- [ ] All primary buttons and chips support active physical depression (`active:scale-*`).
- [ ] No transitions exceed 350ms for micro-actions or 400ms for sheets/dialogs.
- [ ] All animations and transitions use compositor-only properties (`transform`, `opacity`).
- [ ] Mobile hover ghosting is prevented.
- [ ] Async operations display immediate visual loading indicators within 100ms.


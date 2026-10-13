# Data Model & Interaction State Machine

**Feature**: `specs/030-interaction-design`  
**Date**: 2026-10-13  
**Status**: Completed  

---

## Component Interaction State Model

```typescript
export type InteractionState =
  | "default"
  | "hover"
  | "focus_visible"
  | "active"
  | "loading"
  | "disabled"
  | "success"
  | "error";

export interface ComponentInteractionConfig {
  componentId: string;
  hasActiveFeedback: boolean;
  hasHoverFeedback: boolean;
  hasFocusRing: boolean;
  hasLoadingState: boolean;
  transitionDurationMs: number;
  easingFunction: string;
}
```

---

## State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> Default: Mount Component
    Default --> Hover: Pointer Over (Desktop)
    Hover --> Default: Pointer Out
    Default --> FocusVisible: Tab Navigation
    FocusVisible --> Default: Blur
    Hover --> Active: Mouse Down / Touch Press
    FocusVisible --> Active: Space / Enter Down
    Active --> Default: Release Outside
    Active --> Loading: Trigger Async Action
    Loading --> Success: Request Fulfilled
    Loading --> Error: Request Rejected
    Success --> Default: Timeout / Reset
    Error --> Default: Retry / Reset
    Default --> Disabled: Disabled Prop Set
    Disabled --> Default: Disabled Prop Cleared
```


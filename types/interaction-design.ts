export type InteractionState =
  | "default"
  | "hover"
  | "focus_visible"
  | "active"
  | "loading"
  | "disabled"
  | "success"
  | "error";

export interface InteractionTimingTokens {
  instantMs: number;
  fastMs: number;
  normalMs: number;
  smoothMs: number;
}

export const INTERACTION_TIMING: InteractionTimingTokens = {
  instantMs: 100, // <= 100ms: Feels instantaneous & tactile
  fastMs: 150,    // Micro-interactions (taps, hovers, pills)
  normalMs: 250,  // Dropdowns, tooltips, accordions
  smoothMs: 350,  // Sheets, dialogs, drawers
};

export const INTERACTION_EASINGS = {
  enter: "cubic-bezier(0, 0, 0.2, 1)",      // Ease-out for appearing elements
  exit: "cubic-bezier(0.4, 0, 1, 1)",       // Ease-in for disappearing elements
  natural: "cubic-bezier(0.4, 0, 0.2, 1)",  // Ease-in-out for standard movements
};


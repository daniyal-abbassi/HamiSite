/**
 * The one state type every dashboard section shares (C1 in
 * specs/015-admin-dashboard/contracts/dashboard-contracts.md).
 *
 * - `loading`  — the request is in flight.
 * - `real`     — data arrived and is non-empty. The only state that may render a number.
 * - `empty`    — data arrived and legitimately contains nothing. A different message and
 *                affordance from `unreadable`; conflating them is the common failure this
 *                type exists to stop.
 * - `unreadable` — the request failed or is not authorised. Names the failure and offers a
 *                retry that re-attempts only this section.
 *
 * Invariant: no section may render a number while its state is not `real`. A section that
 * cannot read never shows `0`, because `0` is a claim about the shop that the API did not
 * make (Principle I, data-model.md:34-35).
 *
 * Pure module — no React, no "use client" — so the node-environment vitest suite can test
 * the reducer directly.
 */

export type ReadState = "loading" | "real" | "empty" | "unreadable";

export type SectionEvent<T> =
  | { kind: "success"; data: T }
  | { kind: "failure"; message: string };

export type ReducedRead<T> =
  | { state: "loading"; data: null; error: null }
  | { state: "real"; data: T; error: null }
  | { state: "empty"; data: null; error: null }
  | { state: "unreadable"; data: null; error: string };

/**
 * Maps one fetch outcome onto the section state. `isEmpty` is the section's own judgment of
 * "the API answered and there is nothing here" — kept as a parameter so the reducer stays
 * generic and testable.
 */
export function reduceReadState<T>(
  event: SectionEvent<T>,
  isEmpty: (data: T) => boolean,
): ReducedRead<T> {
  switch (event.kind) {
    case "failure":
      return { state: "unreadable", data: null, error: event.message };
    case "success":
      return isEmpty(event.data)
        ? { state: "empty", data: null, error: null }
        : { state: "real", data: event.data, error: null };
  }
}

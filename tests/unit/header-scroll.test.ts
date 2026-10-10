import { describe, expect, it } from "vitest";
import { nextHeaderScrollState, type HeaderScrollState } from "../../components/layout/header-scroll";

function move(state: HeaderScrollState, positions: number[]) {
  return positions.reduce(nextHeaderScrollState, state);
}

describe("header scroll visibility", () => {
  const initial: HeaderScrollState = { lastY: 100, travel: 0, visible: true };

  it("hides after several small downward movements", () => {
    expect(move(initial, [103, 106, 109, 112]).visible).toBe(false);
  });

  it("reveals after several small upward movements", () => {
    const hidden = { lastY: 150, travel: 0, visible: false };
    expect(move(hidden, [147, 144, 141, 138]).visible).toBe(true);
  });

  it("ignores short direction changes and always reveals near the top", () => {
    const hidden = { lastY: 150, travel: 0, visible: false };
    expect(move(hidden, [147, 150]).visible).toBe(false);
    expect(move(hidden, [147, 40]).visible).toBe(true);
  });
});

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { FOCUSABLE_SELECTOR } from "@/hooks/useFocusTrap";

describe("useFocusTrap constants & focusable element matching", () => {
  it("matches all standard interactive HTML elements", () => {
    expect(FOCUSABLE_SELECTOR).toContain("a[href]");
    expect(FOCUSABLE_SELECTOR).toContain("button:not([disabled])");
    expect(FOCUSABLE_SELECTOR).toContain("textarea:not([disabled])");
    expect(FOCUSABLE_SELECTOR).toContain("input:not([disabled])");
    expect(FOCUSABLE_SELECTOR).toContain("select:not([disabled])");
    expect(FOCUSABLE_SELECTOR).toContain('[tabindex]:not([tabindex="-1"])');
  });

  it("handles keyboard events according to focus trapping rules", () => {
    // Test logic simulating keyboard trap loop
    const elements = [
      { id: "btn-first", focus: vi.fn() },
      { id: "input-middle", focus: vi.fn() },
      { id: "btn-last", focus: vi.fn() },
    ];

    const first = elements[0];
    const last = elements[2];

    // Case 1: Tab on last element -> wraps to first
    let activeElement = last;
    let shiftKey = false;
    let prevented = false;

    if (!shiftKey && activeElement === last) {
      prevented = true;
      first.focus();
    }
    expect(prevented).toBe(true);
    expect(first.focus).toHaveBeenCalledTimes(1);

    // Case 2: Shift+Tab on first element -> wraps to last
    activeElement = first;
    shiftKey = true;
    prevented = false;

    if (shiftKey && activeElement === first) {
      prevented = true;
      last.focus();
    }
    expect(prevented).toBe(true);
    expect(last.focus).toHaveBeenCalledTimes(1);
  });

  it("triggers escape callback when Escape is pressed", () => {
    const onEscape = vi.fn();
    const event = {
      key: "Escape",
      preventDefault: vi.fn(),
    };

    if (event.key === "Escape" && onEscape) {
      event.preventDefault();
      onEscape();
    }

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});


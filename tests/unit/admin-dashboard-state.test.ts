/**
 * The ReadState reducer (C1, data-model.md:21-35). Node-environment suite — the pure
 * reducer, not the hook: vitest here has no DOM harness.
 *
 * The invariant under test: `empty` (the API answered, nothing is there) and
 * `unreadable` (the API could not be read) are different states, and a failed read
 * never lands in a state that renders a number.
 */
import { describe, expect, it } from "vitest";
import {
  reduceReadState,
  type SectionEvent,
} from "@/components/admin/dashboard/sections/readState";

const isEmpty = (rows: number[]) => rows.length === 0;

describe("reduceReadState", () => {
  it("success with rows lands in real, data intact", () => {
    const result = reduceReadState<number[]>({ kind: "success", data: [1, 2] }, isEmpty);
    expect(result.state).toBe("real");
    expect(result.data).toEqual([1, 2]);
    expect(result.error).toBeNull();
  });

  it("success with no rows lands in empty — distinguishable from unreadable, never a rendered 0", () => {
    const result = reduceReadState<number[]>({ kind: "success", data: [] }, isEmpty);
    expect(result.state).toBe("empty");
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it("an HTTP error lands in unreadable with the message, data dropped", () => {
    const result = reduceReadState<number[]>({ kind: "failure", message: "boom" }, isEmpty);
    expect(result.state).toBe("unreadable");
    expect(result.data).toBeNull();
    expect(result.error).toBe("boom");
  });

  it("a non-ADMIN 403 lands in unreadable like any other failure — never empty, never real", () => {
    // FORBIDDEN_ROLE from lib/auth.ts:214 — the role guard's rejection is a failure
    // event like any other HTTP error; the point of this case is that it must not be
    // mistaken for "answered, nothing here".
    const event: SectionEvent<number[]> = { kind: "failure", message: "Forbidden" };
    const result = reduceReadState(event, isEmpty);
    expect(result.state).toBe("unreadable");
    expect(result.data).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError, codeForStatus, ok, parseJsonBody, readJson, withErrorHandling } from "@/lib/http";

function jsonReq(body: string) {
  return new Request("http://localhost/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("failure envelope codes", () => {
  it("derives a stable code from the status when the route passes none", async () => {
    for (const [status, code] of [
      [400, "BAD_REQUEST"],
      [401, "AUTH_REQUIRED"],
      [403, "FORBIDDEN"],
      [404, "NOT_FOUND"],
      [409, "CONFLICT"],
      [500, "INTERNAL_ERROR"],
    ] as const) {
      const res = await withErrorHandling(async () => {
        throw new ApiError(status, "boom");
      });
      expect((await res.json()).error.code).toBe(code);
    }
  });

  it("lets an explicit code win over the status fallback", async () => {
    const res = await withErrorHandling(async () =>
      Promise.reject(ApiError.coded(401, "INVALID_CREDENTIALS", "Invalid credentials")),
    );
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
    expect(body.error.message).toBe("Invalid credentials");
    expect(body.error.details).toBeUndefined();
  });

  it("maps a non-ApiError throw to 500 INTERNAL_ERROR", async () => {
    const res = await withErrorHandling(async () => {
      throw new TypeError("kaboom");
    });
    expect(res.status).toBe(500);
    expect((await res.json()).error.code).toBe("INTERNAL_ERROR");
  });

  it("keeps the success envelope untouched", async () => {
    const body = await (await withErrorHandling(async () => ok({ a: 1 }, { m: 2 }))).json();
    expect(body).toEqual({ success: true, data: { a: 1 }, meta: { m: 2 } });
  });

  it("codeForStatus falls back sensibly for unmapped statuses", () => {
    expect(codeForStatus(418)).toBe("BAD_REQUEST");
    expect(codeForStatus(503)).toBe("INTERNAL_ERROR");
  });
});

describe("readJson / parseJsonBody", () => {
  it("turns a malformed body into 400 MALFORMED_JSON, not 500", async () => {
    const res = await withErrorHandling(async () => ok(await readJson(jsonReq("{ not json"))));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("MALFORMED_JSON");
  });

  it("turns an empty body into 400 MALFORMED_JSON", async () => {
    const res = await withErrorHandling(async () => ok(await readJson(jsonReq(""))));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("MALFORMED_JSON");
  });

  it("parseJsonBody resolves on success and 400s with field details on failure", async () => {
    const schema = z.object({ a: z.string().min(2) });
    await expect(parseJsonBody(jsonReq('{"a":"hello"}'), schema)).resolves.toEqual({ a: "hello" });

    const res = await withErrorHandling(async () => ok(await parseJsonBody(jsonReq('{"a":"x"}'), schema)));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.details.fieldErrors.a).toBeTruthy();
  });
});

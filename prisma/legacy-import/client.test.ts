import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLegacyClient, loadLegacyClientConfig, mapWithConcurrency } from "./client";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("loadLegacyClientConfig", () => {
  it("reads API_TOKEN and WEBSITE_URL from the given env file", () => {
    const tmpFile = path.join(os.tmpdir(), `legacy-env-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, "API_TOKEN=abc123\nWEBSITE_URL=https://example.com/\n");

    const config = loadLegacyClientConfig(tmpFile);

    expect(config).toEqual({ baseUrl: "https://example.com/api/v4", apiToken: "abc123" });
    fs.unlinkSync(tmpFile);
  });

  it("throws if API_TOKEN is missing", () => {
    const tmpFile = path.join(os.tmpdir(), `legacy-env-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, "WEBSITE_URL=https://example.com/\n");

    expect(() => loadLegacyClientConfig(tmpFile)).toThrow(/API_TOKEN/);
    fs.unlinkSync(tmpFile);
  });
});

describe("createLegacyClient", () => {
  const config = { baseUrl: "https://example.com/api/v4", apiToken: "abc123" };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the Api-Key auth header and parses JSON", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "success", data: { id: 1 } }),
    });

    const client = createLegacyClient(config);
    const result = await client.fetchJson<{ status: string; data: { id: number } }>("/categories/1/");

    expect(result.data.id).toBe(1);
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://example.com/api/v4/categories/1/");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Api-Key abc123");
  });

  it("throws on a non-2xx response", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Unauthorized" }),
    });

    const client = createLegacyClient(config);
    await expect(client.fetchJson("/categories/")).rejects.toThrow(/401/);
  });

  it("fetchAllPages loops until has_next is false", async () => {
    const page1 = { status: "success", data: [{ id: 1 }, { id: 2 }], message: "", pagination: { page: 1, page_size: 2, total_count: 3, total_pages: 2, has_next: true, has_previous: false } };
    const page2 = { status: "success", data: [{ id: 3 }], message: "", pagination: { page: 2, page_size: 2, total_count: 3, total_pages: 2, has_next: false, has_previous: true } };
    const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => page1 });
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => page2 });

    const client = createLegacyClient(config);
    const rows = await client.fetchAllPages<{ id: number }>("/brands/", {}, 2);

    expect(rows.map((r) => r.id)).toEqual([1, 2, 3]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("mapWithConcurrency", () => {
  it("runs at most `limit` items concurrently and preserves result order", async () => {
    let active = 0;
    let maxActive = 0;

    const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return n * 10;
    });

    expect(results).toEqual([10, 20, 30, 40, 50]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});

import dotenv from "dotenv";
import fs from "node:fs";

export interface LegacyPagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface LegacyListResponse<T> {
  status: string;
  data: T[];
  message: string;
  pagination: LegacyPagination | null;
}

export interface LegacyClientConfig {
  baseUrl: string;
  apiToken: string;
}

export function loadLegacyClientConfig(envFilePath = "actuall_old_webSite_api_token.txt"): LegacyClientConfig {
  const parsed = dotenv.parse(fs.readFileSync(envFilePath));

  const apiToken = parsed.API_TOKEN;
  if (!apiToken) throw new Error(`Missing API_TOKEN in ${envFilePath}`);

  const websiteUrl = parsed.WEBSITE_URL;
  if (!websiteUrl) throw new Error(`Missing WEBSITE_URL in ${envFilePath}`);

  const baseUrl = `${websiteUrl.replace(/\/$/, "")}/api/v4`;
  return { baseUrl, apiToken };
}

export interface LegacyClient {
  fetchJson<T>(path: string, params?: Record<string, string | number>): Promise<T>;
  fetchAllPages<T>(path: string, params?: Record<string, string | number>, pageSize?: number): Promise<T[]>;
}

export function createLegacyClient(config: LegacyClientConfig): LegacyClient {
  function buildUrl(path: string, params?: Record<string, string | number>): string {
    const url = new URL(`${config.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  async function fetchJson<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = buildUrl(path, params);
    const response = await fetch(url, {
      headers: { Authorization: `Api-Key ${config.apiToken}` },
    });

    if (!response.ok) {
      throw new Error(`Legacy API request failed: ${response.status} ${path}`);
    }

    return (await response.json()) as T;
  }

  async function fetchAllPages<T>(path: string, params: Record<string, string | number> = {}, pageSize = 100): Promise<T[]> {
    const rows: T[] = [];
    let page = 1;

    while (true) {
      const response = await fetchJson<LegacyListResponse<T>>(path, { ...params, page, page_size: pageSize });
      rows.push(...response.data);

      if (!response.pagination?.has_next) break;
      page += 1;
    }

    return rows;
  }

  return { fetchJson, fetchAllPages };
}

export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

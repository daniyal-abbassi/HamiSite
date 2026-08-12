import { beforeEach } from "vitest";
import { resetDb } from "./helpers/db";
import path from "node:path";
import Module from "node:module";

// Pre-load and cache the payment modules so require() can access them via Module.cache
async function cachePaymentModules() {
  try {
    const mockModule = await import("@/lib/payment/mock");
    const mockPath = path.resolve(process.cwd(), "lib/payment/mock.ts");

    // Create a fake module entry that require() can use
    if (!Module._cache[mockPath]) {
      Module._cache[mockPath] = {
        id: mockPath,
        filename: mockPath,
        loaded: true,
        exports: mockModule,
        parent: null,
        children: [],
        paths: [],
      } as any;
    }
  } catch (e) {
    console.warn("Failed to cache mock module:", e);
  }

  try {
    const zarinpalModule = await import("@/lib/payment/zarinpal");
    const zarinpalPath = path.resolve(process.cwd(), "lib/payment/zarinpal.ts");

    if (!Module._cache[zarinpalPath]) {
      Module._cache[zarinpalPath] = {
        id: zarinpalPath,
        filename: zarinpalPath,
        loaded: true,
        exports: zarinpalModule,
        parent: null,
        children: [],
        paths: [],
      } as any;
    }
  } catch (e) {
    // Expected - zarinpal might not exist yet
  }
}

// Patch require to handle @/ alias
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id.startsWith("@/")) {
    const resolvedPath = path.resolve(process.cwd(), id.slice(2) + ".ts");

    // Check if it's in the cache
    if (Module._cache[resolvedPath]) {
      return Module._cache[resolvedPath].exports;
    }

    // Try without .ts extension
    const resolvedPathNoExt = path.resolve(process.cwd(), id.slice(2));
    if (Module._cache[resolvedPathNoExt]) {
      return Module._cache[resolvedPathNoExt].exports;
    }

    throw new Error(`Cannot find module '${id}' (resolved to ${resolvedPath})`);
  }
  return originalRequire.call(this, id);
};

// Cache modules before tests run
cachePaymentModules().catch(console.error);

beforeEach(async () => {
  await resetDb();
});

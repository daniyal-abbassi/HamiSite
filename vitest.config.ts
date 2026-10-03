import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // tsconfig sets `jsx: "preserve"` for Next, which leaves JSX untransformed and makes
  // the transform emit invalid JS the moment a test imports a component. The brand-row
  // drift guard imports components/brand/BrandMarks.tsx, so JSX is compiled here.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "node",
    // Scope discovery to this app. Without it, vitest's default glob sweeps the
    // whole tree and pulls in hami-hamrah-luxury's frontend unit tests, running
    // them under this suite's Postgres setup — a broken frontend test would then
    // fail backend CI. The frontend has its own vitest config.
    include: ["tests/**/*.test.ts", "prisma/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});

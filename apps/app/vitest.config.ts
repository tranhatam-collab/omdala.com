import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // tsconfig keeps jsx as "preserve" for Next; the tests need it compiled.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": here } }, // the tsconfig "@/*" path
  test: {
    environment: "jsdom",
    globals: true,
    include: ["app/**/*.{test,spec}.{ts,tsx}", "playwright-staging-policy.test.ts"],
  },
});

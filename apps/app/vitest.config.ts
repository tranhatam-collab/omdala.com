import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig keeps jsx as "preserve" for Next; the tests need it compiled.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["app/**/*.{test,spec}.{ts,tsx}", "playwright-staging-policy.test.ts"],
  },
});

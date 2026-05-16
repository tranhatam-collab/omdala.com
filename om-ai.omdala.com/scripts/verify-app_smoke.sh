#!/usr/bin/env bash
set -euo pipefail

echo "[smoke] install Playwright browsers (if needed)"
if node ./node_modules/playwright/cli.js install; then
  echo "[smoke] run Playwright app smoke tests"
  node ./node_modules/playwright/cli.js test -c web/e2e/playwright.config.ts web/e2e/app-smoke.spec.ts
else
  echo "[smoke] Playwright install failed, running fallback smoke"
  node ./scripts/verify-app_smoke-fallback.mjs
fi

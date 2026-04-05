#!/usr/bin/env bash
set -euo pipefail

echo "[smoke] install Playwright browsers (if needed)"
npx playwright install

echo "[smoke] run Playwright app smoke tests"
npx playwright test -c web/e2e/playwright.config.ts web/e2e/app-smoke.spec.ts

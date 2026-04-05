#!/usr/bin/env bash

set -euo pipefail

run_step() {
  local label="$1"
  shift
  printf "\n==> %s\n" "$label"
  "$@"
}

printf "Starting release verification matrix...\n"

run_step "API health + envelope checks" bash ./scripts/verify-api-omdala.sh
run_step "API typecheck" pnpm --filter @omdala/api typecheck
run_step "API tests" pnpm --filter @omdala/api test

run_step "App build" pnpm --filter @omdala/app build
run_step "App typecheck" pnpm --filter @omdala/app typecheck
run_step "App prod smoke e2e" pnpm --filter @omdala/app test:e2e:prod

run_step "Web build" pnpm --filter @omdala/web build
run_step "Web typecheck" pnpm --filter @omdala/web typecheck
run_step "Web local e2e" pnpm --filter @omdala/web test:e2e
run_step "Web release alias e2e" pnpm test:web:e2e:release

if [[ "${VERIFY_WEB_CANONICAL:-false}" == "true" ]]; then
  run_step "Web canonical e2e" env E2E_BASE_URL="https://omdala-web.pages.dev" pnpm --filter @omdala/web test:e2e
fi

printf "\nRelease verification matrix passed.\n"

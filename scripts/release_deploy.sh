#!/usr/bin/env bash

set -euo pipefail

DEPLOY_API="${DEPLOY_API:-true}"
DEPLOY_APP="${DEPLOY_APP:-true}"
DEPLOY_WEB="${DEPLOY_WEB:-true}"
SKIP_VERIFY="${SKIP_VERIFY:-false}"

API_ENV="${API_ENV:-production}"
APP_BRANCH="${APP_BRANCH:-production}"
WEB_BRANCH="${WEB_BRANCH:-production}"

run_step() {
  local label="$1"
  shift
  printf "\n==> %s\n" "$label"
  "$@"
}

printf "Starting release deploy pipeline...\n"
printf -- "- DEPLOY_API=%s (API_ENV=%s)\n" "$DEPLOY_API" "$API_ENV"
printf -- "- DEPLOY_APP=%s (APP_BRANCH=%s)\n" "$DEPLOY_APP" "$APP_BRANCH"
printf -- "- DEPLOY_WEB=%s (WEB_BRANCH=%s)\n" "$DEPLOY_WEB" "$WEB_BRANCH"
printf -- "- SKIP_VERIFY=%s\n" "$SKIP_VERIFY"

if [[ "$DEPLOY_API" != "true" && "$DEPLOY_APP" != "true" && "$DEPLOY_WEB" != "true" ]]; then
  printf "No surfaces selected for deployment. Set one of DEPLOY_API/DEPLOY_APP/DEPLOY_WEB to true.\n" >&2
  exit 1
fi

if [[ "$DEPLOY_API" == "true" ]]; then
  if [[ "$API_ENV" == "production" ]]; then
    run_step "Deploy API (production)" pnpm --filter @omdala/api run deploy
  else
    run_step "Deploy API (env=${API_ENV})" pnpm --filter @omdala/api run deploy -- --env "$API_ENV"
  fi
fi

if [[ "$DEPLOY_APP" == "true" ]]; then
  run_step "Deploy App (branch=${APP_BRANCH})" node scripts/cloudflare-pages-deploy.mjs app "$APP_BRANCH"
fi

if [[ "$DEPLOY_WEB" == "true" ]]; then
  run_step "Deploy Web (branch=${WEB_BRANCH})" node scripts/cloudflare-pages-deploy.mjs web "$WEB_BRANCH"
fi

if [[ "$SKIP_VERIFY" != "true" ]]; then
  run_step "Post-deploy verification matrix" pnpm release:verify
fi

printf "\nRelease deploy pipeline completed.\n"

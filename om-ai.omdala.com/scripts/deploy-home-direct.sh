#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-ai-omdala-home}"
VITE_DEPLOY_STATUS="${VITE_DEPLOY_STATUS:-production}"
VITE_RELEASE_TAG="${VITE_RELEASE_TAG:-manual-direct}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.omdala.com}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-}"
ARTIFACTS_DIR="${ARTIFACTS_DIR:-.deploy-artifacts}"

if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  echo "[deploy-home-direct] missing CLOUDFLARE_ACCOUNT_ID"
  exit 1
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "[deploy-home-direct] missing CLOUDFLARE_API_TOKEN"
  exit 1
fi

echo "[deploy-home-direct] build web"
VITE_DEPLOY_STATUS="$VITE_DEPLOY_STATUS" \
VITE_RELEASE_TAG="$VITE_RELEASE_TAG" \
VITE_API_BASE_URL="$VITE_API_BASE_URL" \
npm run build:home

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARTIFACT_PATH="$ARTIFACTS_DIR/${STAMP}-${VITE_RELEASE_TAG}"
mkdir -p "$ARTIFACT_PATH"
cp -R web/dist/. "$ARTIFACT_PATH/"
echo "[deploy-home-direct] artifact saved: $ARTIFACT_PATH"

echo "[deploy-home-direct] deploy to Cloudflare Pages"
if [[ -n "$DEPLOY_BRANCH" ]]; then
  npx wrangler pages deploy "$ARTIFACT_PATH" --project-name "$PROJECT_NAME" --branch "$DEPLOY_BRANCH"
else
  npx wrangler pages deploy "$ARTIFACT_PATH" --project-name "$PROJECT_NAME"
fi

echo "[deploy-home-direct] latest deployments"
npx wrangler pages deployment list --project-name "$PROJECT_NAME"

#!/usr/bin/env bash
set -euo pipefail

export DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
export VITE_DEPLOY_STATUS="${VITE_DEPLOY_STATUS:-production}"
export VITE_RELEASE_TAG="${VITE_RELEASE_TAG:-manual-prod-full}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.omdala.com}"

HOME_URL="${HOME_URL:-https://app.omdala.com}"
API_BASE_URL="${API_BASE_URL:-https://api.omdala.com}"

echo "[deploy-prod-full] deploy home to production"
bash ./scripts/deploy-home-direct.sh

echo "[deploy-prod-full] verify production home + api"
HOME_URL="$HOME_URL" API_BASE_URL="$API_BASE_URL" bash ./scripts/verify-prod-direct.sh

echo "[deploy-prod-full] done"

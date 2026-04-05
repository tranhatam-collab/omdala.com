#!/usr/bin/env bash
set -euo pipefail

HOME_URL="${HOME_URL:-https://app.omdala.com}"
API_BASE_URL="${API_BASE_URL:-https://api.omdala.com}"

echo "[verify-prod] home=$HOME_URL"
HOME_URL="$HOME_URL" bash ./scripts/verify-home.sh

echo "[verify-prod] api=$API_BASE_URL"
API_BASE_URL="$API_BASE_URL" bash ./scripts/verify-api-omdala.sh

echo "[verify-prod] done"

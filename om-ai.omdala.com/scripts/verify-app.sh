#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-https://api.omdala.com}"

echo "[verify-app] run app unit tests"
npm run app:test

echo "[verify-app] smoke magic link endpoint"
curl -sSf -X POST "$API_BASE_URL/v1/auth/magic-link/request" \
  -H 'content-type: application/json' \
  --data '{"email":"verify@app.omdala.com","redirectTo":"/dashboard"}' >/dev/null

echo "[verify-app] ok"

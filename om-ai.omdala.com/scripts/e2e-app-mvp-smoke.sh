#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-https://api.omdala.com}"

echo "[e2e-app-mvp] run app unit tests"
npm run app:test

echo "[e2e-app-mvp] request magic link"
curl -sSf -X POST "$API_BASE_URL/v1/auth/magic-link/request" \
  -H 'content-type: application/json' \
  --data '{"email":"verify@app.omdala.com","redirectTo":"/dashboard"}' >/dev/null

echo "[e2e-app-mvp] check reality health"
curl -sSf "$API_BASE_URL/v2/reality/health" >/dev/null

echo "[e2e-app-mvp] check reality nodes"
curl -sSf "$API_BASE_URL/v2/reality/nodes" >/dev/null

echo "[e2e-app-mvp] optional scenes flow"
SCENES_STATUS="$(curl -sS -o /tmp/scenes_body.json -w "%{http_code}" "$API_BASE_URL/v2/reality/scenes")"
if [[ "$SCENES_STATUS" == "200" ]]; then
  SCENE_ID="$(node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync("/tmp/scenes_body.json","utf8"));const id=j?.data?.scenes?.[0]?.scene_id||"";process.stdout.write(id)')"
  if [[ -n "$SCENE_ID" ]]; then
    curl -sSf -X POST "$API_BASE_URL/v2/reality/scenes/$SCENE_ID/run" \
      -H 'content-type: application/json' \
      -H 'x-user-id: app_user' \
      -H 'x-role: owner' \
      --data '{}' >/dev/null
  fi
else
  echo "[e2e-app-mvp] scenes endpoint unavailable on current production API, skipping optional scene run"
fi

echo "[e2e-app-mvp] done"

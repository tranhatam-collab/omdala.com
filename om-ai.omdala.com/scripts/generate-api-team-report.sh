#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-https://api.omdala.com}"
OUT_FILE="API_TEAM_STRICT_REPORT.md"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

status_of() {
  local path="$1"
  local tmp_body
  tmp_body="$(mktemp)"
  local status
  status=$(curl -sS -o "$tmp_body" -w "%{http_code}" "$API_BASE_URL$path")
  local body
  body=$(cat "$tmp_body")
  rm -f "$tmp_body"
  printf '%s\n%s' "$status" "$body"
}

SCENES_RESULT="$(status_of '/v2/reality/scenes')"
SCENES_STATUS="$(printf '%s' "$SCENES_RESULT" | awk 'NR==1{print $1}')"
SCENES_BODY="$(printf '%s' "$SCENES_RESULT" | sed '1d')"

RUNS_RESULT="$(status_of '/v2/reality/runs?page=1&limit=10')"
RUNS_STATUS="$(printf '%s' "$RUNS_RESULT" | awk 'NR==1{print $1}')"
RUNS_BODY="$(printf '%s' "$RUNS_RESULT" | sed '1d')"

cat > "$OUT_FILE" <<EOF
# API Team Strict Launch Report

- generated_at_utc: $STAMP
- api_base_url: $API_BASE_URL

## Required endpoints

- GET /v2/reality/scenes (expected: 200)
- GET /v2/reality/runs?page=1&limit=10 (expected: 200)

## Current status

- /v2/reality/scenes: $SCENES_STATUS
- /v2/reality/runs?page=1&limit=10: $RUNS_STATUS

## Response snapshots

### scenes_body

$SCENES_BODY

### runs_body

$RUNS_BODY

## Action request

Please enable both endpoints on production API ($API_BASE_URL) with envelope response shape.
After deployment, notify to re-run strict gate:



npm run e2e:app:mvp:strict
EOF

echo "[api:strict:report] wrote $OUT_FILE"

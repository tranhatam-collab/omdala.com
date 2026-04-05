#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-https://api.omdala.com}"
OUT_FILE="API_STRICT_BLOCKER_STATUS.md"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

check() {
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

SCENES_RESULT="$(check '/v2/reality/scenes')"
SCENES_STATUS="$(printf '%s' "$SCENES_RESULT" | awk 'NR==1{print $1}')"
SCENES_BODY="$(printf '%s' "$SCENES_RESULT" | sed '1d')"

RUNS_RESULT="$(check '/v2/reality/runs?page=1&limit=10')"
RUNS_STATUS="$(printf '%s' "$RUNS_RESULT" | awk 'NR==1{print $1}')"
RUNS_BODY="$(printf '%s' "$RUNS_RESULT" | sed '1d')"

SCENES_CHECK='- [ ] `GET /v2/reality/scenes` endpoint available on production'
if [[ "$SCENES_STATUS" == "200" ]]; then
  SCENES_CHECK='- [x] `GET /v2/reality/scenes` endpoint available on production'
fi

RUNS_CHECK='- [ ] `GET /v2/reality/runs` endpoint available on production'
if [[ "$RUNS_STATUS" == "200" ]]; then
  RUNS_CHECK='- [x] `GET /v2/reality/runs` endpoint available on production'
fi

cat > "$OUT_FILE" <<EOF
# API Strict Blocker Status

- checked_at_utc: $STAMP
- api_base_url: $API_BASE_URL

## Launch blockers

$SCENES_CHECK
$RUNS_CHECK

## Raw endpoint diagnostics

- /v2/reality/scenes: status=$SCENES_STATUS
- /v2/reality/runs?page=1&limit=10: status=$RUNS_STATUS

### scenes_response


$SCENES_BODY

### runs_response


$RUNS_BODY
EOF

echo "[update-api-strict-status] wrote $OUT_FILE"

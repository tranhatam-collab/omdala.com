#!/usr/bin/env bash

set -euo pipefail

API_BASE_URL="${API_BASE_URL:-https://api.omdala.com}"

ok() {
  printf "[OK] %s\n" "$1"
}

fail() {
  printf "[FAIL] %s\n" "$1" >&2
  exit 1
}

check_status_200() {
  local path="$1"
  local code
  code="$(curl -sS -o /tmp/omdala_api_verify_body.json -w "%{http_code}" "${API_BASE_URL}${path}")"
  if [[ "$code" != "200" ]]; then
    printf "Response body: %s\n" "$(cat /tmp/omdala_api_verify_body.json 2>/dev/null || true)" >&2
    fail "${path} returned HTTP ${code}"
  fi
  ok "${path} returned HTTP 200"
}

check_json_keys() {
  local path="$1"
  local code
  local body
  code="$(curl -sS -o /tmp/omdala_api_verify_body.json -w "%{http_code}" "${API_BASE_URL}${path}")"
  body="$(cat /tmp/omdala_api_verify_body.json 2>/dev/null || true)"
  if [[ "$code" != "200" ]]; then
    printf "Response body: %s\n" "$body" >&2
    fail "${path} returned HTTP ${code}"
  fi
  printf "%s" "$body" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert "data" in d; assert "meta" in d'
  ok "${path} returned JSON with data/meta"
}

printf "Verifying API base URL: %s\n" "$API_BASE_URL"

check_status_200 "/health"
check_status_200 "/v2/reality/health"
check_json_keys "/v2/reality/nodes"

printf "All checks passed for %s\n" "$API_BASE_URL"

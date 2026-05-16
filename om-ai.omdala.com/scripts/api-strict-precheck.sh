#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-https://api.omdala.com}"

check_endpoint() {
  local path="$1"
  local expected_status="$2"
  local tmp_body
  tmp_body="$(mktemp)"

  local status
  status=$(curl -sS -o "$tmp_body" -w "%{http_code}" "$API_BASE_URL$path")

  echo "[api-strict-precheck] endpoint: $path"
  echo "  expected_status: $expected_status"
  echo "  actual_status:   $status"

  if [[ "$status" != "$expected_status" ]]; then
    echo "  result: FAIL"
    echo "  body:"
    cat "$tmp_body"
    rm -f "$tmp_body"
    return 1
  fi

  echo "  result: PASS"
  rm -f "$tmp_body"
}

echo "[api-strict-precheck] base: $API_BASE_URL"

check_endpoint "/v2/reality/scenes" "200"
check_endpoint "/v2/reality/runs?page=1&limit=10" "200"

echo "[api-strict-precheck] all strict endpoints pass"

#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-https://api.omdala.com}"

echo "[verify-api] base: $API_BASE_URL"

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

check_endpoint() {
  local path="$1"
  local expected_status="$2"
  local out_file="$TMP_DIR/body"

  local status
  status=$(curl -sS -o "$out_file" -w "%{http_code}" "$API_BASE_URL$path")

  if [[ "$status" != "$expected_status" ]]; then
    echo "[verify-api] FAIL $path expected=$expected_status actual=$status"
    echo "[verify-api] body:"
    cat "$out_file"
    exit 1
  fi

  echo "[verify-api] OK $path status=$status"
  cat "$out_file"
  echo
}

check_endpoint "/health" "200"
check_endpoint "/v2/reality/health" "200"

NODES_BODY="$TMP_DIR/nodes.json"
NODES_STATUS=$(curl -sS -o "$NODES_BODY" -w "%{http_code}" "$API_BASE_URL/v2/reality/nodes")

if [[ "$NODES_STATUS" != "200" ]]; then
  echo "[verify-api] FAIL /v2/reality/nodes expected=200 actual=$NODES_STATUS"
  cat "$NODES_BODY"
  exit 1
fi

echo "[verify-api] OK /v2/reality/nodes status=200"
node -e '
const fs = require("fs");
const text = fs.readFileSync(process.argv[1], "utf8");
let json;
try {
  json = JSON.parse(text);
} catch {
  console.error("[verify-api] FAIL nodes response is not JSON");
  process.exit(1);
}
if (json.ok !== true || !("data" in json)) {
  console.error("[verify-api] FAIL nodes response missing ok/data");
  process.exit(1);
}
console.log("[verify-api] envelope ok");
console.log(JSON.stringify({
  node_count: Array.isArray(json?.data?.nodes) ? json.data.nodes.length : null,
  has_meta: Object.prototype.hasOwnProperty.call(json, "meta"),
}, null, 2));
' "$NODES_BODY"

echo "[verify-api] done"

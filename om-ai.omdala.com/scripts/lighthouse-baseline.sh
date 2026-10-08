#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://app.omdala.com}"
OUT_DIR="${OUT_DIR:-lighthouse-reports}"

mkdir -p "$OUT_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
JSON_FILE="$OUT_DIR/lighthouse-${STAMP}.json"
HTML_FILE="$OUT_DIR/lighthouse-${STAMP}.html"

echo "[lighthouse] running on $BASE_URL"
npx lighthouse "$BASE_URL" --quiet --chrome-flags="--headless" --output=json --output=html --output-path="$JSON_FILE"

if [[ -f "${JSON_FILE%.json}.report.html" ]]; then
  mv "${JSON_FILE%.json}.report.html" "$HTML_FILE"
fi

echo "[lighthouse] wrote $JSON_FILE"
echo "[lighthouse] wrote $HTML_FILE"

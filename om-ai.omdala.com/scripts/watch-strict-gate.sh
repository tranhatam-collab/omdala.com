#!/usr/bin/env bash
set -euo pipefail

INTERVAL_SECONDS="${INTERVAL_SECONDS:-60}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-30}"

echo "[strict-watch] interval=${INTERVAL_SECONDS}s attempts=${MAX_ATTEMPTS}"

attempt=1
while [[ "$attempt" -le "$MAX_ATTEMPTS" ]]; do
  echo "[strict-watch] attempt $attempt/$MAX_ATTEMPTS"

  if npm run e2e:app:mvp:strict; then
    echo "[strict-watch] strict gate PASS on attempt $attempt"
    exit 0
  fi

  if [[ "$attempt" -eq "$MAX_ATTEMPTS" ]]; then
    echo "[strict-watch] strict gate still failing after $MAX_ATTEMPTS attempts"
    exit 1
  fi

  sleep "$INTERVAL_SECONDS"
  attempt=$((attempt + 1))
done

#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"

resolve_database_url() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    return 0
  fi

  for candidate in "${ENV_FILE}" ".env.local"; do
    if [[ -f "${candidate}" ]]; then
      while IFS='=' read -r key value; do
        [[ "${key}" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${key//[[:space:]]/}" ]] && continue

        key="${key#export }"
        key="${key//[[:space:]]/}"

        if [[ "${key}" = "DATABASE_URL" ]]; then
          value="${value#\"}"
          value="${value%\"}"
          value="${value#\'}"
          value="${value%\'}"
          DATABASE_URL="${value}"
          export DATABASE_URL
          return 0
        fi
      done < "${candidate}"
    fi
  done

  return 1
}

echo "[chain] start full v2 reality chain"

echo "[chain] step 1/4: API tests"
pnpm --filter @omdala/api test

echo "[chain] step 2/4: strict CI smoke"
if resolve_database_url; then
  bash scripts/smoke_v2_reality_ci.sh
else
  echo "[chain] strict CI smoke skipped: DATABASE_URL not found"
fi

echo "[chain] step 3/4: standard smoke"
bash scripts/smoke_v2_reality.sh

echo "[chain] step 4/4: trace query export"
bash scripts/smoke_v2_reality_trace_request.sh

echo "[chain] done"

#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"

if [[ -z "${DATABASE_URL:-}" ]]; then
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
          break
        fi
      done < "${candidate}"
    fi

    if [[ -n "${DATABASE_URL:-}" ]]; then
      break
    fi
  done
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[smoke-ci] ERROR: DATABASE_URL is required for strict cleanup mode"
  echo "[smoke-ci] Set DATABASE_URL directly or via ${ENV_FILE}/.env.local"
  exit 1
fi

export DATABASE_URL
export SMOKE_CLEANUP=1

echo "[smoke-ci] run cleanup safety integration check"
psql "${DATABASE_URL}" -f scripts/cleanup_test_data.test.sql >/tmp/omdala_cleanup_safety_test.log 2>&1 || {
  echo "[smoke-ci] ERROR: cleanup safety integration check failed"
  cat /tmp/omdala_cleanup_safety_test.log
  exit 1
}

bash scripts/smoke_v2_reality.sh

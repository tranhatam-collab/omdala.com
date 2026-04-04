#!/usr/bin/env bash
set -euo pipefail

EXPORT_FILE="${1:-${LOG_EXPORT_FILE:-}}"
OUTPUT_FILE="${2:-${LOG_CACHE_FILE:-reports/ops/cache/v2-log-query-cache.json}}"

if [[ -z "${EXPORT_FILE}" ]]; then
  echo "[cache] ERROR: missing export file path"
  echo "[cache] Usage: bash scripts/ops_v2_build_log_cache.sh <export_file> [output_file]"
  echo "[cache] Or set LOG_EXPORT_FILE env var"
  exit 1
fi

python3 scripts/ops_v2_build_log_cache.py "${EXPORT_FILE}" "${OUTPUT_FILE}"

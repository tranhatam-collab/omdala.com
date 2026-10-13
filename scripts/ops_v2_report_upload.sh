#!/usr/bin/env bash
set -euo pipefail

REPORT_FILE="${1:-}"

if [[ -z "${REPORT_FILE}" ]]; then
  echo "[upload] ERROR: missing report file argument"
  exit 1
fi

if [[ ! -f "${REPORT_FILE}" ]]; then
  echo "[upload] ERROR: report file not found: ${REPORT_FILE}"
  exit 1
fi

UPLOAD_STATUS="skipped"
UPLOAD_TARGET="none"

if [[ -n "${REPORT_UPLOAD_URL:-}" ]]; then
  curl -sS -X POST "${REPORT_UPLOAD_URL}" \
    -H "Content-Type: application/json" \
    ${REPORT_UPLOAD_TOKEN:+-H "Authorization: Bearer ${REPORT_UPLOAD_TOKEN}"} \
    --data-binary "@${REPORT_FILE}" >/tmp/omdala_report_upload_response.json

  UPLOAD_STATUS="uploaded"
  UPLOAD_TARGET="${REPORT_UPLOAD_URL}"
  echo "[upload] uploaded to endpoint: ${REPORT_UPLOAD_URL}"
elif [[ -n "${REPORT_UPLOAD_DIR:-}" ]]; then
  mkdir -p "${REPORT_UPLOAD_DIR}"
  cp "${REPORT_FILE}" "${REPORT_UPLOAD_DIR}/"
  UPLOAD_STATUS="copied"
  UPLOAD_TARGET="${REPORT_UPLOAD_DIR}"
  echo "[upload] copied to directory: ${REPORT_UPLOAD_DIR}"
else
  echo "[upload] skipped: REPORT_UPLOAD_URL or REPORT_UPLOAD_DIR not set"
fi

printf '%s|%s\n' "${UPLOAD_STATUS}" "${UPLOAD_TARGET}"

#!/usr/bin/env bash
set -euo pipefail

# OMDALA PostgreSQL restore helper
# Usage:
#   DATABASE_URL="postgresql://..." bash scripts/backup/omdala_pg_restore.sh /path/to/backup.sql.gz

BACKUP_FILE="${1:-}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

if [[ -z "${BACKUP_FILE}" ]]; then
  echo "ERROR: backup file path is required"
  echo "Usage: DATABASE_URL=... bash scripts/backup/omdala_pg_restore.sh /path/to/backup.sql.gz"
  exit 1
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "ERROR: backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "[restore] restoring ${BACKUP_FILE}"

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}"
else
  psql "${DATABASE_URL}" < "${BACKUP_FILE}"
fi

echo "[restore] done"

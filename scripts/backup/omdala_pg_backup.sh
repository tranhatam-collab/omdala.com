#!/usr/bin/env bash
set -euo pipefail

# OMDALA PostgreSQL backup script
# Usage:
#   DATABASE_URL="postgresql://..." BACKUP_DIR="/var/backups/omdala" bash scripts/backup/omdala_pg_backup.sh

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/omdala}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

FILENAME="omdala_prod_${TIMESTAMP}.sql.gz"
TARGET_PATH="${BACKUP_DIR}/${FILENAME}"

echo "[backup] starting pg_dump -> ${TARGET_PATH}"

pg_dump --no-owner --no-privileges "${DATABASE_URL}" | gzip -9 > "${TARGET_PATH}"

echo "[backup] completed: ${TARGET_PATH}"

echo "[backup] pruning files older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -type f -name "omdala_prod_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete

echo "[backup] done"

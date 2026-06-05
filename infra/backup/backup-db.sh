#!/bin/sh
# OMDALA Backup Script (P4)
# Runs inside backup container via cron.
# Usage: backup-db.sh

set -e

TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)
DUMP_FILE="/backups/omdala_backup_${TIMESTAMP}.sql.gz"
R2_KEY="backups/postgres/omdala_backup_${TIMESTAMP}.sql.gz"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting backup..."

# pg_dump (uses backup role credentials)
PGPASSWORD="${POSTGRES_BACKUP_PASSWORD:-${POSTGRES_PASSWORD}}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -U "${POSTGRES_BACKUP_USER:-${POSTGRES_USER}}" \
  -d "${POSTGRES_DB}" \
  --no-owner --no-privileges \
  | gzip > "${DUMP_FILE}"

SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
echo "Dump complete: ${SIZE}"

# Upload to R2
aws s3 cp "${DUMP_FILE}" "s3://${R2_BUCKET_BACKUPS}/${R2_KEY}" \
  --endpoint-url "${R2_ENDPOINT}" \
  --region auto

echo "Upload complete: ${R2_KEY}"

# Cleanup old backups (retention)
find /backups -type f -name "*.sql.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup finished."

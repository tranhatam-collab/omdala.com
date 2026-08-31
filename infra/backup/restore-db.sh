#!/bin/sh
# OMDALA Restore Script (P4)
# Restores PostgreSQL from R2 backup.
# Usage: restore-db.sh <backup_key_or_latest>

set -e

BACKUP_KEY="${1:-latest}"
R2_BUCKET="${R2_BUCKET_BACKUPS:-omdala-prod-backups}"
R2_ENDPOINT="${R2_ENDPOINT:-}"
RESTORE_DIR="/tmp/restore"

mkdir -p "$RESTORE_DIR"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting restore..."

# Determine backup key
if [ "$BACKUP_KEY" = "latest" ]; then
  echo "Finding latest backup..."
  BACKUP_KEY=$(aws s3 ls "s3://${R2_BUCKET}/backups/postgres/" \
    --endpoint-url "$R2_ENDPOINT" --region auto \
    | sort | tail -1 | awk '{print $4}')
  if [ -z "$BACKUP_KEY" ]; then
    echo "ERROR: No backups found in s3://${R2_BUCKET}/backups/postgres/"
    exit 1
  fi
  echo "Latest backup: $BACKUP_KEY"
fi

# Download from R2
LOCAL_FILE="${RESTORE_DIR}/restore.sql.gz"
echo "Downloading ${BACKUP_KEY}..."
aws s3 cp "s3://${R2_BUCKET}/backups/postgres/${BACKUP_KEY}" "$LOCAL_FILE" \
  --endpoint-url "$R2_ENDPOINT" --region auto

echo "Download complete. Restoring..."

# Restore (drop + recreate for clean state)
gunzip -c "$LOCAL_FILE" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "${POSTGRES_HOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --set ON_ERROR_STOP=on

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Restore complete."

# Cleanup
rm -f "$LOCAL_FILE"

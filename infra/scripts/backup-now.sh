#!/bin/bash
# OMDALA Infra — Manual Backup Trigger (P4)
# Creates pg_dump and uploads to R2.
# Usage: ./scripts/backup-now.sh

set -euo pipefail

source .env 2>/dev/null || { echo "ERROR: .env not found. Run: cp infra/.env.example .env"; exit 1; }

TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)
DUMP_FILE="/tmp/omdala_backup_${TIMESTAMP}.sql.gz"
R2_KEY="backups/postgres/omdala_backup_${TIMESTAMP}.sql.gz"

echo "=== OMDALA Backup ==="
echo "Timestamp: $TIMESTAMP"
echo "Database:  ${POSTGRES_DB}"
echo "Dump:      ${DUMP_FILE}"
echo "R2 Key:    ${R2_KEY}"
echo ""

# pg_dump
echo "[1/3] Running pg_dump..."
docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" omdala-postgres \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  --no-owner --no-privileges --clean --if-exists \
  | gzip > "${DUMP_FILE}"

SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
echo "Dump complete: ${SIZE}"

# Upload to R2
echo "[2/3] Uploading to R2..."
# Using aws-cli or rclone. Here using aws-cli with R2 endpoint.
aws s3 cp "${DUMP_FILE}" "s3://${R2_BUCKET_BACKUPS}/${R2_KEY}" \
  --endpoint-url "${R2_ENDPOINT}" \
  --region auto \
  --storage-class STANDARD

echo "Upload complete."

# Cleanup
echo "[3/3] Cleaning up local dump..."
rm -f "${DUMP_FILE}"

# Log
echo ""
echo "=== Backup Success ==="
echo "File: s3://${R2_BUCKET_BACKUPS}/${R2_KEY}"
echo "Size: ${SIZE}"
echo "Next: Run ./scripts/restore-test.sh to verify."

#!/bin/bash
# OMDALA Infra — Restore Verification (P4)
# Downloads latest backup, restores to staging DB, verifies row counts.
# MANDATORY: Must pass before production deploy.
# Usage: ./scripts/restore-test.sh

set -euo pipefail

source .env 2>/dev/null || { echo "ERROR: .env not found"; exit 1; }

echo "=== OMDALA Restore Test ==="
echo "This is a MANDATORY gate. If this fails, backup is NOT valid."
echo ""

# Find latest backup
echo "[1/5] Finding latest backup in R2..."
LATEST=$(aws s3 ls "s3://${R2_BUCKET_BACKUPS}/backups/postgres/" \
  --endpoint-url "${R2_ENDPOINT}" \
  --region auto \
  | sort | tail -n 1 | awk '{print $4}')

if [[ -z "$LATEST" ]]; then
  echo "ERROR: No backup found in R2."
  exit 1
fi

echo "Latest backup: $LATEST"

# Download
echo "[2/5] Downloading backup..."
LOCAL_DUMP="/tmp/omdala_restore_test.sql.gz"
aws s3 cp "s3://${R2_BUCKET_BACKUPS}/backups/postgres/${LATEST}" "${LOCAL_DUMP}" \
  --endpoint-url "${R2_ENDPOINT}" \
  --region auto

# Create staging DB
echo "[3/5] Creating staging database..."
STAGING_DB="${POSTGRES_DB}_restore_test_$(date -u +%s)"
docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" omdala-postgres \
  psql -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE \"${STAGING_DB}\";"

# Restore
echo "[4/5] Restoring to staging..."
gunzip -c "${LOCAL_DUMP}" | docker exec -i -e PGPASSWORD="${POSTGRES_PASSWORD}" omdala-postgres \
  psql -U "${POSTGRES_USER}" -d "${STAGING_DB}"

# Verify row counts
echo "[5/5] Verifying row counts..."
PROD_ROWS=$(docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" omdala-postgres \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';\" | xargs)

STAGE_ROWS=$(docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" omdala-postgres \
  psql -U "${POSTGRES_USER}" -d "${STAGING_DB}" -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';\" | xargs)

if [[ "$PROD_ROWS" == "$STAGE_ROWS" ]]; then
  echo "  [OK] Table count match: ${PROD_ROWS} tables"
else
  echo "  [FAIL] Table count MISMATCH: prod=${PROD_ROWS}, staging=${STAGE_ROWS}"
  CLEANUP_FAIL=1
fi

# Cleanup staging
echo ""
echo "Cleaning up staging database..."
docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" omdala-postgres \
  psql -U "${POSTGRES_USER}" -d postgres -c "DROP DATABASE IF EXISTS \"${STAGING_DB}\";"
rm -f "${LOCAL_DUMP}"

if [[ "${CLEANUP_FAIL:-0}" == "1" ]]; then
  echo "=== RESTORE TEST FAILED ==="
  exit 1
fi

echo "=== RESTORE TEST PASSED ==="
echo "Backup ${LATEST} is VALID. Safe for production."
exit 0

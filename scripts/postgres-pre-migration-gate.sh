#!/usr/bin/env bash
set -euo pipefail

umask 077

required=(
  SOURCE_DATABASE_URL
  RESTORE_DATABASE_URL
  EXPECTED_SOURCE_DATABASE_HOST
  EXPECTED_SOURCE_DATABASE_NAME
  BACKUP_ENCRYPTION_KEY
  CANDIDATE_SHA
  RELEASE_ENVIRONMENT
  BACKUP_OUTPUT_DIR
)
for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Required environment value ${name} is missing" >&2
    exit 1
  fi
done
if (( ${#BACKUP_ENCRYPTION_KEY} < 32 )); then
  echo "BACKUP_ENCRYPTION_KEY must contain at least 32 characters" >&2
  exit 1
fi
for command_name in node pg_dump pg_restore psql openssl jq sha256sum cmp wc; do
  command -v "$command_name" >/dev/null || {
    echo "Required command ${command_name} is unavailable" >&2
    exit 1
  }
done

mkdir -p "$BACKUP_OUTPUT_DIR"
work_dir="$(mktemp -d)"
plain_dump="$work_dir/source.dump"
decrypted_dump="$work_dir/source.decrypted.dump"
source_inventory="$work_dir/source.inventory"
restore_inventory="$work_dir/restore.inventory"
target_receipt="$work_dir/target-receipt.json"
encrypted_dump="$BACKUP_OUTPUT_DIR/pre-migration-${CANDIDATE_SHA}.dump.enc"
receipt="$BACKUP_OUTPUT_DIR/pre-migration-receipt.json"
cleanup() {
  rm -rf "$work_dir"
}
trap cleanup EXIT

node scripts/postgres-target-guard.mjs \
  --source-url "$SOURCE_DATABASE_URL" \
  --restore-url "$RESTORE_DATABASE_URL" \
  --expected-source-host "$EXPECTED_SOURCE_DATABASE_HOST" \
  --expected-source-database "$EXPECTED_SOURCE_DATABASE_NAME" \
  --receipt "$target_receipt" >/dev/null

pg_dump "$SOURCE_DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$plain_dump"

pg_restore "$plain_dump" \
  --dbname="$RESTORE_DATABASE_URL" \
  --no-owner \
  --no-acl \
  --exit-on-error

write_inventory() {
  local database_url="$1"
  local output_path="$2"
  psql "$database_url" --quiet --tuples-only --no-align --set ON_ERROR_STOP=1 >"$output_path" <<'SQL'
CREATE TEMP TABLE omdala_release_inventory (
  schema_name text NOT NULL,
  table_name text NOT NULL,
  exact_rows bigint NOT NULL
);
DO $inventory$
DECLARE
  item record;
  row_total bigint;
BEGIN
  FOR item IN
    SELECT schemaname, tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename
  LOOP
    EXECUTE format('SELECT count(*) FROM %I.%I', item.schemaname, item.tablename)
      INTO row_total;
    INSERT INTO omdala_release_inventory VALUES (
      item.schemaname,
      item.tablename,
      row_total
    );
  END LOOP;
END
$inventory$;
SELECT schema_name || '.' || table_name || '|' || exact_rows
FROM omdala_release_inventory
ORDER BY schema_name, table_name;
SQL
}

write_inventory "$SOURCE_DATABASE_URL" "$source_inventory"
write_inventory "$RESTORE_DATABASE_URL" "$restore_inventory"
cmp --silent "$source_inventory" "$restore_inventory" || {
  echo "Restored database table inventory or exact row counts differ from source" >&2
  exit 1
}

BACKUP_ENCRYPTION_KEY="$BACKUP_ENCRYPTION_KEY" openssl enc \
  -aes-256-cbc \
  -salt \
  -pbkdf2 \
  -iter 200000 \
  -pass env:BACKUP_ENCRYPTION_KEY \
  -in "$plain_dump" \
  -out "$encrypted_dump"

BACKUP_ENCRYPTION_KEY="$BACKUP_ENCRYPTION_KEY" openssl enc \
  -d \
  -aes-256-cbc \
  -pbkdf2 \
  -iter 200000 \
  -pass env:BACKUP_ENCRYPTION_KEY \
  -in "$encrypted_dump" \
  -out "$decrypted_dump"
cmp --silent "$plain_dump" "$decrypted_dump" || {
  echo "Encrypted backup failed decrypt-and-compare verification" >&2
  exit 1
}

dump_sha256="$(sha256sum "$plain_dump" | awk '{print $1}')"
encrypted_sha256="$(sha256sum "$encrypted_dump" | awk '{print $1}')"
inventory_sha256="$(sha256sum "$source_inventory" | awk '{print $1}')"
table_count="$(wc -l < "$source_inventory" | tr -d ' ')"

jq -n \
  --arg candidate_sha "$CANDIDATE_SHA" \
  --arg environment "$RELEASE_ENVIRONMENT" \
  --arg created_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg dump_sha256 "$dump_sha256" \
  --arg encrypted_backup_sha256 "$encrypted_sha256" \
  --arg inventory_sha256 "$inventory_sha256" \
  --arg table_count "$table_count" \
  --slurpfile targets "$target_receipt" \
  '{
    schema_version: 1,
    verdict: "BACKUP_RESTORE_VERIFIED",
    candidate_sha: $candidate_sha,
    environment: $environment,
    created_at: $created_at,
    source: $targets[0].source,
    restore: $targets[0].restore,
    source_and_restore_distinct: true,
    dump_sha256: $dump_sha256,
    encrypted_backup_sha256: $encrypted_backup_sha256,
    inventory_sha256: $inventory_sha256,
    table_count: ($table_count | tonumber),
    exact_row_counts_match: true,
    encrypted_backup_decrypt_verified: true
  }' > "$receipt"

receipt_sha256="$(sha256sum "$receipt" | awk '{print $1}')"
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "receipt_sha256=$receipt_sha256"
    echo "encrypted_backup_sha256=$encrypted_sha256"
  } >> "$GITHUB_OUTPUT"
fi

echo "Backup restored and verified before migration. Receipt SHA-256: $receipt_sha256"

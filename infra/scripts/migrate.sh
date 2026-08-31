#!/bin/bash
# OMDALA Database Migration Runner
# Usage: ./scripts/migrate.sh [--seed]

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$ENV_FILE"
fi

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-omdala_prod}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
SEED="${1:-}"

echo "=== OMDALA Database Migration ==="
echo "Database: $POSTGRES_DB"
echo "Host: $POSTGRES_HOST"
echo ""

# Wait for PostgreSQL to be ready
echo "[1/3] Waiting for PostgreSQL..."
until docker exec "$POSTGRES_HOST" pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; do
  echo "  PostgreSQL not ready yet, waiting..."
  sleep 2
done
echo "  PostgreSQL is ready."

# Run init scripts
echo ""
echo "[2/3] Running schema migrations..."
docker exec -i "$POSTGRES_HOST" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < ./postgres/init-scripts/01-create-users.sql
docker exec -i "$POSTGRES_HOST" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < ./postgres/init-scripts/02-create-schemas.sql
echo "  Schema migration complete."

# Seed data (optional)
if [[ "$SEED" == "--seed" ]]; then
  echo ""
  echo "[3/3] Seeding development data..."
  docker exec -i "$POSTGRES_HOST" psql -U "${POSTGRES_APP_USER:-omdala_app}" -d "$POSTGRES_DB" < ./postgres/init-scripts/03-seed-data.sql
  echo "  Seeding complete."
fi

echo ""
echo "=== Migration finished ==="

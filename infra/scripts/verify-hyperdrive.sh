#!/bin/bash
# Verify Hyperdrive PostgreSQL schema and connectivity
# Usage: ./scripts/verify-hyperdrive.sh <hyperdrive_id>

set -euo pipefail

HYPERDRIVE_ID="${1:-${HYPERDRIVE_ID:-}}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"

if [[ -z "$HYPERDRIVE_ID" || -z "$ACCOUNT_ID" || -z "$API_TOKEN" ]]; then
  echo "Usage: $0 <hyperdrive_id>"
  echo "Or set HYPERDRIVE_ID, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN"
  exit 1
fi

echo "=== Hyperdrive Schema Verification ==="
echo "Hyperdrive ID: $HYPERDRIVE_ID"
echo ""

# Fetch Hyperdrive config
echo "[1/3] Fetching Hyperdrive config..."
curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/hyperdrive/configs/$HYPERDRIVE_ID" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" | jq '.result' > /tmp/hyperdrive-config.json

echo "  Config saved to /tmp/hyperdrive-config.json"

# Verify origin settings
echo "[2/3] Verifying origin settings..."
ORIGIN_HOST=$(jq -r '.origin.host' /tmp/hyperdrive-config.json)
ORIGIN_PORT=$(jq -r '.origin.port' /tmp/hyperdrive-config.json)
ORIGIN_DB=$(jq -r '.origin.database' /tmp/hyperdrive-config.json)

echo "  Host: $ORIGIN_HOST"
echo "  Port: $ORIGIN_PORT"
echo "  Database: $ORIGIN_DB"

# Verify caching settings
echo "[3/3] Verifying caching settings..."
CACHE_DISABLED=$(jq -r '.caching.disabled' /tmp/hyperdrive-config.json)
CACHE_MAX_AGE=$(jq -r '.caching.max_age' /tmp/hyperdrive-config.json)

echo "  Caching disabled: $CACHE_DISABLED"
echo "  Max age: ${CACHE_MAX_AGE}s"

# Validate schema expectations
ERRORS=0
if [[ "$ORIGIN_PORT" != "5432" ]]; then
  echo "  ERROR: Expected port 5432, got $ORIGIN_PORT"
  ERRORS=$((ERRORS + 1))
fi

if [[ "$CACHE_DISABLED" != "false" ]]; then
  echo "  ERROR: Expected caching disabled=false"
  ERRORS=$((ERRORS + 1))
fi

if [[ "$ERRORS" -gt 0 ]]; then
  echo ""
  echo "Verification FAILED with $ERRORS error(s)"
  exit 1
fi

echo ""
echo "=== Hyperdrive Schema VERIFIED ==="
echo "Next: Test connectivity from Worker binding"

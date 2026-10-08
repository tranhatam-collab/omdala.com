#!/bin/bash
# Migrate secrets from .env files to Cloudflare Secrets Store
# Usage: ./scripts/cf-secrets-migrate.sh <worker_name>

set -euo pipefail

WORKER_NAME="${1:-omdala-api}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"

if [[ -z "$ACCOUNT_ID" || -z "$API_TOKEN" ]]; then
  echo "Error: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN required"
  exit 1
fi

echo "=== CF Secrets Store Migration ==="
echo "Worker: $WORKER_NAME"
echo ""

# Read .env and upload each key as a secret
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue

  # Skip non-sensitive keys
  [[ "$key" =~ ^(NODE_ENV|PORT|NEXT_PUBLIC_.*)$ ]] && continue

  echo "Uploading secret: $key"
  curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/secrets" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$key\",\"text\":\"$value\",\"type\":\"secret_text\"}" | jq -r '.success'
done < .env

echo ""
echo "=== Migration Complete ==="
echo "Verify with: wrangler secret list"

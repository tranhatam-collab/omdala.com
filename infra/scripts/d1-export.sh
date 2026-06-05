#!/bin/bash
# D1 Export Script for P0 Inventory
# Exports all D1 databases from Cloudflare accounts for migration analysis.
# Usage: ./scripts/d1-export.sh [account_id] [api_token]

set -euo pipefail

ACCOUNT_ID="${1:-${CLOUDFLARE_ACCOUNT_ID}}"
API_TOKEN="${2:-${CLOUDFLARE_API_TOKEN}}"
OUTPUT_DIR="${3:-./.data/d1-exports}"

if [[ -z "$ACCOUNT_ID" || -z "$API_TOKEN" ]]; then
  echo "Usage: $0 <account_id> <api_token> [output_dir]"
  echo "Or set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN env vars"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "=== D1 Export for Account: $ACCOUNT_ID ==="
echo "Output: $OUTPUT_DIR"
echo ""

# List all D1 databases
echo "[1/3] Listing D1 databases..."
DATABASES=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" | jq -r '.result[] | .uuid + "," + .name' 2>/dev/null || true)

if [[ -z "$DATABASES" ]]; then
  echo "  No D1 databases found or API error."
  exit 0
fi

TOTAL=0
while IFS=',' read -r DB_ID DB_NAME; do
  TOTAL=$((TOTAL + 1))
  echo "  Exporting: $DB_NAME ($DB_ID)"
  
  # Export database
  curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database/$DB_ID/export" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" | jq '.' > "$OUTPUT_DIR/${DB_NAME}_${DB_ID}.json"
  
  # Also export schema only
  curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/d1/database/$DB_ID/query" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"sql": "SELECT name FROM sqlite_master WHERE type=\"table\""}' | jq '.' > "$OUTPUT_DIR/${DB_NAME}_${DB_ID}_schema.json"
done <<< "$DATABASES"

echo ""
echo "[2/3] Exported $TOTAL D1 databases to $OUTPUT_DIR"

# Generate inventory summary
echo "[3/3] Generating inventory summary..."
cat > "$OUTPUT_DIR/inventory-summary.json" << EOF
{
  "exported_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "account_id": "$ACCOUNT_ID",
  "total_databases": $TOTAL,
  "databases": [
EOF

FIRST=true
while IFS=',' read -r DB_ID DB_NAME; do
  if [[ "$FIRST" == "true" ]]; then
    FIRST=false
  else
    echo "," >> "$OUTPUT_DIR/inventory-summary.json"
  fi
  echo -n "    {\"id\": \"$DB_ID\", \"name\": \"$DB_NAME\"}" >> "$OUTPUT_DIR/inventory-summary.json"
done <<< "$DATABASES"

cat >> "$OUTPUT_DIR/inventory-summary.json" << EOF

  ]
}
EOF

echo "=== D1 Export Complete ==="
echo "Next steps:"
echo "  1. Review $OUTPUT_DIR/inventory-summary.json"
echo "  2. Run ./scripts/d1-to-postgres.sh for migration"
echo "  3. Update P0 inventory document with findings"

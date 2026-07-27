#!/bin/bash
# G0.2 — Generate checksum manifest (optimized — prune heavy dirs at find level)
set -euo pipefail

ROOT="/Users/tranhatam/Documents/Devnewproject/omdala.com"
OUT_DIR="$ROOT/docs/audit/2026-07-19/snapshot"
MANIFEST="$OUT_DIR/CHECKSUM_MANIFEST.tsv"
SECRET_INVENTORY="$OUT_DIR/SECRET_NAME_INVENTORY.txt"
SKIPPED="$OUT_DIR/SKIPPED_FILES.txt"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

mkdir -p "$OUT_DIR"

echo "# OMDALA Filesystem Checksum Manifest" > "$MANIFEST"
echo "# Generated: $TIMESTAMP" >> "$MANIFEST"
echo "# Root: $ROOT" >> "$MANIFEST"
echo "# Format: TSV — path<TAB>size_bytes<TAB>sha256" >> "$MANIFEST"
echo "# Secret-bearing files: EXCLUDED from checksum (path+size only in SECRET_NAME_INVENTORY.txt)" >> "$MANIFEST"
echo -e "path\tsize_bytes\tsha256" >> "$MANIFEST"

echo "# OMDALA Secret-Bearing File Name Inventory" > "$SECRET_INVENTORY"
echo "# Generated: $TIMESTAMP" >> "$SECRET_INVENTORY"
echo "# SAFETY: Only PATH and SIZE recorded. Secret values NOT read or recorded." >> "$SECRET_INVENTORY"
echo -e "path\tsize_bytes\treason" >> "$SECRET_INVENTORY"

echo "# OMDALA Skipped Files (unreadable or timed out)" > "$SKIPPED"
echo "# Generated: $TIMESTAMP" >> "$SKIPPED"
echo -e "path\treason" >> "$SKIPPED"

count_total=0
count_checksummed=0
count_secret=0
count_skipped=0

# Prune heavy directories at find level for speed
while IFS= read -r -d '' file; do
  count_total=$((count_total + 1))
  rel_path="${file#$ROOT/}"
  size=$(stat -f%z "$file" 2>/dev/null || echo "0")

  # Check if secret-bearing (by filename)
  base=$(basename "$file")
  case "$base" in
    .env|.env.local|.env.production|.env.db.local|.env.example)
      count_secret=$((count_secret + 1))
      echo -e "$rel_path\t${size}\tsecret-bearing-env" >> "$SECRET_INVENTORY"
      continue
      ;;
  esac

  # Compute SHA256
  if checksum=$(shasum -a 256 "$file" 2>/dev/null | awk '{print $1}'); then
    count_checksummed=$((count_checksummed + 1))
    echo -e "$rel_path\t${size}\t${checksum}" >> "$MANIFEST"
  else
    count_skipped=$((count_skipped + 1))
    echo -e "$rel_path\tread-error-or-timeout" >> "$SKIPPED"
  fi
done < <(find "$ROOT" -type f \
  -not -path '*/.git/*' \
  -not -path '*/node_modules/*' \
  -not -path '*/node_modules_stale_*/*' \
  -not -path '*/.next/*' \
  -not -path '*/.turbo/*' \
  -not -path '*/.wrangler/*' \
  -not -path '*/dist/*' \
  -not -path '*/out/*' \
  -not -path '*/build/*' \
  -not -path '*/.devin/*' \
  -not -path '*/.claude/*' \
  -not -path '*/.codeium/*' \
  -not -path '*/pnpm-store/*' \
  -not -path '*/.deploy-artifacts/*' \
  -not -path '*/release-snapshots/*' \
  -not -path '*/lighthouse-reports/*' \
  -not -name '.DS_Store' \
  -not -name 'tsconfig.tsbuildinfo' \
  -not -name '*.log' \
  -print0 2>/dev/null)

SUMMARY="$OUT_DIR/SNAPSHOT_SUMMARY.txt"
cat > "$SUMMARY" << EOF
# OMDALA Filesystem Snapshot Summary
# Generated: $TIMESTAMP
# Root: $ROOT

## Counts
- Total files scanned: $count_total
- Files with checksum: $count_checksummed
- Secret-bearing (path+size only): $count_secret
- Skipped (read error/timeout): $count_skipped

## Output Files
- CHECKSUM_MANIFEST.tsv — Full checksum manifest (TSV)
- SECRET_NAME_INVENTORY.txt — Secret file names + sizes (NO values)
- SKIPPED_FILES.txt — Files that could not be read
- SNAPSHOT_SUMMARY.txt — This summary

## Safety
- No secret values were read or recorded
- Only file paths and sizes of secret-bearing files are inventoried
- Checksums computed only for non-secret, non-excluded files

## Next Step
- G0.3: Hydrate any skipped files (iCloud/Time Machine sync)
- G0.5: Founder selects canonical repo/branch/commit
- G0.6: Diff this manifest against canonical commit
EOF

echo "=== G0.2 Snapshot Complete ==="
echo "Total: $count_total | Checksummed: $count_checksummed | Secret: $count_secret | Skipped: $count_skipped"

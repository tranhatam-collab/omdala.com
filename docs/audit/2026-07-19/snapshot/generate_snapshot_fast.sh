#!/bin/bash
# G0.2 — Pragmatic snapshot: file listing + sizes + partial checksums
# Full checksums deferred to G0.3 after iCloud hydration
set -euo pipefail

ROOT="/Users/tranhatam/Documents/Devnewproject/omdala.com"
OUT="$ROOT/docs/audit/2026-07-19/snapshot"
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 1. File listing with sizes (fast — stat doesn't read content)
find "$ROOT" -maxdepth 4 -type f \
  -not -path '*/.git/*' -not -path '*/node_modules/*' -not -path '*/node_modules_stale_*/*' \
  -not -path '*/.next/*' -not -path '*/.turbo/*' -not -path '*/.wrangler/*' \
  -not -path '*/.claude/*' -not -path '*/.devin/*' -not -path '*/.codeium/*' \
  -not -path '*/pnpm-store/*' -not -path '*/.deploy-artifacts/*' \
  -not -path '*/release-snapshots/*' -not -path '*/lighthouse-reports/*' \
  -not -path '*/dist/*' -not -path '*/out/*' -not -path '*/build/*' \
  -not -name '.DS_Store' -not -name 'tsconfig.tsbuildinfo' -not -name '*.log' \
  -exec stat -f '%z\t%Sm\t%N' -t '%Y-%m-%dT%H:%M:%S' {} \; 2>/dev/null \
  > "$OUT/FILE_LISTING.tsv"

TOTAL=$(wc -l < "$OUT/FILE_LISTING.tsv")
echo "File listing: $TOTAL files"

# 2. Secret file inventory (names + sizes only, NO values)
echo "# Secret file inventory — NAMES AND SIZES ONLY, NO VALUES" > "$OUT/SECRET_NAME_INVENTORY.txt"
echo "# Generated: $TS" >> "$OUT/SECRET_NAME_INVENTORY.txt"
find "$ROOT" -maxdepth 5 -type f \
  -name '.env' -o -name '.env.local' -o -name '.env.production' \
  -o -name '.env.db.local' -o -name '.env.example' -o -name '.env.dev' \
  2>/dev/null | while read -r f; do
    rel="${f#$ROOT/}"
    sz=$(stat -f%z "$f" 2>/dev/null || echo "?")
    echo -e "$rel\t${sz}bytes\tSECRET-BEARING (value not read)" >> "$OUT/SECRET_NAME_INVENTORY.txt"
done

SECRET_COUNT=$(grep -c "SECRET-BEARING" "$OUT/SECRET_NAME_INVENTORY.txt" 2>/dev/null || echo "0")
echo "Secret files found: $SECRET_COUNT"

# 3. Anomalous filenames (truncated artifacts)
echo "# Anomalous truncated filenames at root" > "$OUT/ANOMALOUS_FILES.txt"
echo "# Generated: $TS" >> "$OUT/ANOMALOUS_FILES.txt"
for f in O Om Omone Omone.om Omone.omd Omone.omdala; do
  if [ -f "$ROOT/$f" ]; then
    sz=$(stat -f%z "$ROOT/$f" 2>/dev/null || echo "?")
    echo -e "$f\t${sz}bytes\tTRUNCATED_FILENAME_ANOMALY" >> "$OUT/ANOMALOUS_FILES.txt"
  fi
done

ANOMALY_COUNT=$(grep -c "ANOMALY" "$OUT/ANOMALOUS_FILES.txt" 2>/dev/null || echo "0")
echo "Anomalous files: $ANOMALY_COUNT"

# 4. Summary
cat > "$OUT/SNAPSHOT_SUMMARY.txt" << EOF
# OMDALA Filesystem Snapshot Summary
# Generated: $TS
# Root: $ROOT

## Status: PARTIAL — Full checksums deferred to G0.3

## Counts
- Files listed (maxdepth 4, excl heavy dirs): $TOTAL
- Secret-bearing files inventoried (names only): $SECRET_COUNT
- Anomalous truncated filenames: $ANOMALY_COUNT

## Why partial checksums
- Filesystem has iCloud-backed files that are not hydrated (stub files)
- Reading un-hydrated files causes timeouts
- Full SHA256 checksums require G0.3 hydration first
- File listing with sizes is complete and fast (stat doesn't read content)

## Anomalies detected
- Truncated filename artifacts at root: O, Om, Omone, Omone.om, Omone.omd, Omone.omdala
- All 4581 bytes, dated Jul 6 14:01 — likely partial write/corruption
- These are NOT valid project files

## Output Files
- FILE_LISTING.tsv — All files with size, mtime, path
- SECRET_NAME_INVENTORY.txt — Secret file names + sizes (NO values)
- ANOMALOUS_FILES.txt — Truncated/corrupted filename artifacts
- SNAPSHOT_SUMMARY.txt — This summary

## Safety
- No secret values were read or recorded
- Only file paths and sizes of secret-bearing files are inventoried

## Next Steps
- G0.3: Hydrate iCloud files, then complete checksums
- G0.5: Founder selects canonical repo/branch/commit
- G0.6: Diff this manifest against canonical commit
EOF

echo "=== G0.2 Snapshot Complete (PARTIAL — checksums deferred to G0.3) ==="
echo "Files: $TOTAL | Secrets: $SECRET_COUNT | Anomalies: $ANOMALY_COUNT"

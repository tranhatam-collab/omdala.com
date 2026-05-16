#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-ai-omdala-home}"
HOME_URL="${HOME_URL:-https://app.omdala.com}"
API_BASE_URL="${API_BASE_URL:-https://api.omdala.com}"
RELEASE_TAG="${RELEASE_TAG:-manual-snapshot}"

mkdir -p release-snapshots
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="release-snapshots/${STAMP}-${RELEASE_TAG}.md"

DEPLOYMENTS=$(npx wrangler pages deployment list --project-name "$PROJECT_NAME")

cat > "$OUT_FILE" <<EOF
# Release Snapshot

- timestamp_utc: $STAMP
- release_tag: $RELEASE_TAG
- project: $PROJECT_NAME
- home_url: $HOME_URL
- api_base_url: $API_BASE_URL

## Deployments

\
$DEPLOYMENTS

EOF

echo "[log-release-snapshot] wrote $OUT_FILE"

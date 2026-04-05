#!/usr/bin/env bash
# ================================================================
# Omniverse O1 — Migration helper
#
# Usage:
#   ./scripts/migrate.sh                    # schema only (auto-detect)
#   ./scripts/migrate.sh --seed             # schema + seed data
#   ./scripts/migrate.sh --seed-only        # seed data only
#   ./scripts/migrate.sh --dry-run          # print SQL, don't execute
#   ./scripts/migrate.sh --adapter postgres # force postgres
#   ./scripts/migrate.sh --adapter d1       # force D1 via wrangler
# ================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Omniverse O1 migration ==="
echo "Working directory: $ROOT_DIR"
echo ""

node "$ROOT_DIR/backend/src/db/migrate.js" "$@"

#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-}"

if [ -z "$TAG" ]; then
  echo "Usage: ./scripts/generate-release-notes.sh <tag>"
  exit 1
fi

OUT_FILE="release-notes-${TAG}.md"
DATE_NOW="$(date +%Y-%m-%d)"

cat > "$OUT_FILE" <<EOF
# Release Notes

Version: ${TAG}
Date: ${DATE_NOW}

## Commit Summary


EOF

if git rev-parse --verify HEAD >/dev/null 2>&1; then
  BASE_REF="$(git describe --tags --abbrev=0 2>/dev/null || true)"
  if [ -n "$BASE_REF" ]; then
    if ! git log --pretty=format:'- %h %s' "$BASE_REF"..HEAD >> "$OUT_FILE" 2>/dev/null; then
      echo "- commit summary unavailable (git history read issue)" >> "$OUT_FILE"
    fi
  else
    if ! git log --pretty=format:'- %h %s' -n 20 >> "$OUT_FILE" 2>/dev/null; then
      echo "- commit summary unavailable (git history read issue)" >> "$OUT_FILE"
    fi
  fi
fi

cat >> "$OUT_FILE" <<'EOF'

## Verification

- [ ] npm run ci
- [ ] npm --prefix backend run e2e
- [ ] npm run smoke

## Notes

- Fill highlight, breaking changes, and rollout notes before publishing.
EOF

echo "Generated $OUT_FILE"

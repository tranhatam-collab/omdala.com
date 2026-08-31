#!/bin/bash
# OMCODE Build Script
# Builds the OM-CODE IDE component and commits artifacts.
# Usage: ./apps/app/.omcode/build.sh

set -euo pipefail

OMCODE_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$OMCODE_DIR")"
BUILD_DIR="${OMCODE_DIR}/dist"

echo "=== OMCODE Build ==="
echo "Dir: $OMCODE_DIR"
echo ""

mkdir -p "$BUILD_DIR"

# Copy rules as versioned artifact
cp "$OMCODE_DIR/rules.md" "$BUILD_DIR/rules-$(date -u +%Y%m%d).md"

# Generate manifest
{
  echo "{"
  echo "  \"name\": \"omcode\","
  echo "  \"version\": \"0.1.0\","
  echo "  \"builtAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"rulesFile\": \"rules-$(date -u +%Y%m%d).md\","
  echo "  \"checksum\": \"$(shasum -a 256 "$OMCODE_DIR/rules.md" | cut -d' ' -f1)\","
  echo "  \"entryPoints\": ["
  echo "    \"app/omcode/landing/page.tsx\","
  echo "    \"app/workspace/components/AIChatPanel.tsx\","
  echo "    \"app/workspace/components/AccountPanel.tsx\""
  echo "  ]"
  echo "}"
} > "$BUILD_DIR/manifest.json"

echo "Build complete:"
ls -la "$BUILD_DIR"

echo ""
echo "=== Next: git add && commit ==="

#!/usr/bin/env bash
# ============================================================
# OMDALA — BRAND v2.0 LINTER (Signal & Substrate)
# Usage: bash scripts/brand-lint-omdala.sh [path]
# Default path: apps/web/app
#
# Fails (exit 1) if any forbidden token / palette violation found.
# Source rules: docs/OMDALA_V2_SIGNAL_SUBSTRATE.md
# ============================================================
set -euo pipefail

TARGET="${1:-apps/web/app}"

if [ ! -d "$TARGET" ]; then
  echo "❌ Target dir not found: $TARGET"
  exit 1
fi

echo "🔍 OMDALA brand-lint scanning: $TARGET"
echo ""

FAILED=0

# ─────────────────────────────────────────────────────────────
# 1. WORD FILTER (OMDALA category language — không nhầm lẫn)
# ─────────────────────────────────────────────────────────────
declare -a FORBIDDEN_PHRASES=(
  # Wrong category language (BRAND_ARCHITECTURE_OMDALA §3 cấm)
  "social app"
  "social network"
  "travel platform"
  "tourism platform"
  "simple marketplace"
  "chatbot product"
  "chatbot platform"
  # Hype phrases not matching brand traits (calm/durable/systemic)
  "revolutionary"
  "disruptive innovation"
  "next-gen"
  "next gen "
  "game changer"
  "game-changer"
  # Forbidden investment-promise (legal risk)
  "guaranteed return"
  "guaranteed profit"
  "fixed yield"
)

echo "─── Word filter check (forbidden category language) ───"
for phrase in "${FORBIDDEN_PHRASES[@]}"; do
  raw=$(grep -rIni "$phrase" "$TARGET" 2>/dev/null || true)
  if [ -z "$raw" ]; then
    continue
  fi
  # Allow negated form ("not a social app", "not a chatbot")
  bad=$(echo "$raw" | grep -ivE "(not a |is not |không phải |never )[^.]{0,40}${phrase}" || true)
  if [ -n "$bad" ]; then
    echo "❌ FORBIDDEN: \"$phrase\""
    echo "$bad" | sed 's/^/     /' | head -3
    FAILED=1
  fi
done
[ "$FAILED" -eq 0 ] && echo "✅ No forbidden category language"
echo ""

# ─────────────────────────────────────────────────────────────
# 2. BRAND PALETTE TOKENS (must reference v2.0 tokens)
# ─────────────────────────────────────────────────────────────
echo "─── Palette token check ───"
CSS_FILE="$TARGET/globals.css"
if [ -f "$CSS_FILE" ]; then
  # Substrate dark must exist
  if grep -qi "#040816" "$CSS_FILE"; then
    echo "✅ Space-950 (#040816) substrate present"
  else
    echo "❌ Space-950 #040816 NOT FOUND in globals.css"
    FAILED=1
  fi

  # Signal cyan must exist
  if grep -qi "#3de7ff" "$CSS_FILE"; then
    echo "✅ Cyan-500 (#3de7ff) signal present"
  else
    echo "❌ Cyan-500 #3de7ff NOT FOUND"
    FAILED=1
  fi

  # Gold verification (v2.0)
  if grep -qi "#D4AF37" "$CSS_FILE"; then
    echo "✅ Gold-500 (#D4AF37) verification present (v2.0)"
  else
    echo "⚠️  Gold-500 #D4AF37 not yet present — v2.0 not fully applied"
  fi

  # v2.0 animations
  if grep -q "omdala-scan\|omdala-ease-luxury" "$CSS_FILE"; then
    echo "✅ v2.0 substrate animations present"
  else
    echo "⚠️  v2.0 animations not found — may not be applied yet"
  fi

  # OFF-PALETTE colors (warn not fail — code may have legacy)
  declare -a OFFPALETTE=("#FF61D8" "#8B5CF6" "#1FE6A8")
  for color in "${OFFPALETTE[@]}"; do
    if grep -qi "$color" "$CSS_FILE"; then
      echo "⚠️  Off-palette color found: $color (consider Signal & Substrate compliance)"
    fi
  done
fi
echo ""

# ─────────────────────────────────────────────────────────────
# 3. ACCESSIBILITY HINTS
# ─────────────────────────────────────────────────────────────
echo "─── Accessibility hints ───"
# Reduced motion handler
if grep -rq "prefers-reduced-motion" "$TARGET" 2>/dev/null; then
  echo "✅ prefers-reduced-motion handler found"
else
  echo "⚠️  No prefers-reduced-motion handler — required by brand v2.0 §6"
fi

# color-scheme dark
if grep -rq "color-scheme:.*dark" "$TARGET" 2>/dev/null; then
  echo "✅ color-scheme: dark declared"
else
  echo "⚠️  color-scheme: dark not declared"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# 4. BRAND ROLE CONSISTENCY (must say "OMDALA" properly)
# ─────────────────────────────────────────────────────────────
echo "─── Brand role consistency ───"
# Must NOT use "Omdala" or "omdala" except in technical strings (URLs, classes)
# Public-facing copy should say "OMDALA"
mixed_case=$(grep -rIE "\bOmdala\b" "$TARGET" 2>/dev/null \
  | grep -vE "(href|className|class|id|css|tsx|aria-|data-|@omdala/)" \
  | grep -ivE "Omdala\.com" || true)
if [ -n "$mixed_case" ]; then
  echo "⚠️  Possible inconsistent capitalization (should be OMDALA in public copy):"
  echo "$mixed_case" | head -3 | sed 's/^/     /'
fi
[ -z "$mixed_case" ] && echo "✅ Brand capitalization consistent"
echo ""

# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
  echo "✅ OMDALA brand-lint PASSED."
  echo "   Source: docs/OMDALA_V2_SIGNAL_SUBSTRATE.md"
  exit 0
else
  echo "❌ OMDALA brand-lint FAILED. Fix violations above."
  exit 1
fi
